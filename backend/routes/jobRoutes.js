const express = require("express");
const Job = require("../models/Job");

const {
  searchAdzunaJobs,
  normalizeAdzunaJob,
} = require("../services/adzunaService");

const router = express.Router();

/*
  GET /api/jobs

  Search jobs stored in Careerly's database.
*/
router.get("/", async (req, res) => {
  try {
    const {
      search = "",
      location = "",
      jobType = "",
      workMode = "",
      page = 1,
      limit = 20,
    } = req.query;

    const query = {
      isActive: true,
    };

    if (search) {
      query.$text = {
        $search: search,
      };
    }

    if (location) {
      query.location = {
        $regex: location,
        $options: "i",
      };
    }

    if (jobType) {
      query.jobType = {
        $regex: jobType,
        $options: "i",
      };
    }

    if (workMode) {
      query.workMode = {
        $regex: workMode,
        $options: "i",
      };
    }

    const pageNumber = Math.max(Number(page), 1);

    const limitNumber = Math.min(
      Math.max(Number(limit), 1),
      50
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort({
          postedAt: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNumber),

      Job.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      jobs,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(
          total / limitNumber
        ),
      },
    });
  } catch (error) {
    console.error(
      "Job search error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
});

/*
  GET /api/jobs/external/search

  Search real jobs from Adzuna and
  save/update them in Careerly's database.
*/
router.get(
  "/external/search",
  async (req, res) => {
    try {
      const {
        search = "",
        location = "",
        jobType = "",
        workMode = "",
        sortBy = "relevance",
        page = 1,
        limit = 20,
      } = req.query;

      const data = await searchAdzunaJobs({
        query: search,
        location,
        jobType,
        workMode,
        sortBy,
        page: Number(page),
        resultsPerPage: Math.min(
          Number(limit),
          50
        ),
      });

      const normalizedJobs = (data.results || []).map(
        normalizeAdzunaJob
      );

      // Save/update external jobs in MongoDB
      const savedJobs = await Promise.all(
        normalizedJobs.map(async (job) => {
          try {
            return await Job.findOneAndUpdate(
              {
                externalId: job.externalId,
                source: "adzuna",
              },
              {
                $set: {
                  title: job.title,
                  company: job.company,
                  location: job.location,
                  description: job.description,
                  jobType: job.jobType,
                  workMode: job.workMode,
                  experienceLevel:
                    job.experienceLevel,
                  skills: job.skills,
                  salary: job.salary,
                  applicationUrl:
                    job.applicationUrl,
                  postedAt: job.postedAt,
                  expiresAt: job.expiresAt,
                  isActive: true,
                  rawData: job.rawData,
                },
              },
              {
                returnDocument: "after",
                upsert: true,
                runValidators: true,
              }
            );
          } catch (error) {
            console.error(
              `Failed to save job ${job.externalId}:`,
              error.message
            );

            return null;
          }
        })
      );

      const validJobs =
        savedJobs.filter(Boolean);

      res.status(200).json({
        success: true,
        source: "adzuna",
        jobs: validJobs,
        count: validJobs.length,
        total: data.total || 0,
        page: data.page || Number(page),
        limit: data.resultsPerPage || Number(limit),
        hasMore: Boolean(data.hasMore),
      });

    } catch (error) {
      console.error(
        "Adzuna API error:",
        error.response?.data ||
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch jobs from external provider",
      });
    }
  }
);

/*
  GET /api/jobs/external/:source/:externalId

  Get a Careerly job using its external
  provider ID and source.
*/
router.get(
  "/external/:source/:externalId",
  async (req, res) => {
    try {
      const {
        source,
        externalId,
      } = req.params;

      const job = await Job.findOne({
        source,
        externalId,
      });

      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      res.status(200).json({
        success: true,
        job,
      });
    } catch (error) {
      console.error(
        "Get external job error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: "Failed to fetch job",
      });
    }
  }
);

/*
  GET /api/jobs/:id

  Get a single Careerly job by MongoDB ID.
*/
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(
      req.params.id
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error(
      "Get job error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch job",
    });
  }
});

module.exports = router;