const express = require("express");

const Job = require("../models/Job");
const SavedJob = require("../models/SavedJob");

const {
  searchAdzunaJobs,
  normalizeAdzunaJob,
} = require("../services/adzunaService");

const router = express.Router();

/*
  GET /api/jobs

  Search jobs already stored in Careerly's database.
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

    const pageNumber = Math.max(
      Number(page),
      1
    );

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

  Search live jobs from Adzuna and cache
  them in Careerly's MongoDB.
*/
router.get(
  "/external/search",
  async (req, res) => {
    try {
      const {
        search = "",
        location = "",
        page = 1,
        limit = 20,
      } = req.query;

      const data =
        await searchAdzunaJobs({
          query: search,
          location,
          page: Number(page),
          resultsPerPage: Math.min(
            Number(limit),
            50
          ),
        });

      const normalizedJobs =
        (data.results || []).map(
          normalizeAdzunaJob
        );

      const jobs = [];

      for (const job of normalizedJobs) {
        const savedJob =
          await Job.findOneAndUpdate(
            {
              externalId:
                job.externalId,
              source:
                job.source,
            },
            job,
            {
              returnDocument: "after",
              upsert: true,
              setDefaultsOnInsert: true,
            }
          );

        jobs.push(savedJob);
      }

      res.status(200).json({
        success: true,
        source: "adzuna",
        jobs,
        count: jobs.length,
        total: data.count || 0,
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
  GET /api/jobs/:id

  Get a Careerly job.

  The ID can be either:
  1. A Job document ID
  2. An older SavedJob document ID

  This makes existing saved jobs continue to work.
*/
router.get("/:id", async (req, res) => {
  try {
    let job = await Job.findById(
      req.params.id
    );

    /*
      If it isn't a Job ID, check whether
      it is an older SavedJob ID.
    */
    if (!job) {
      const savedJob =
        await SavedJob.findById(
          req.params.id
        );

      if (savedJob) {
        job = await Job.findOne({
          externalId:
            savedJob.externalId,

          source:
            savedJob.source,
        });

        /*
          If the corresponding Job document
          doesn't exist, construct the details
          from the SavedJob itself.
        */
        if (!job) {
          return res.status(200).json({
            success: true,

            job: {
              externalId:
                savedJob.externalId,

              source:
                savedJob.source,

              title:
                savedJob.title,

              company:
                savedJob.company,

              location:
                savedJob.location,

              description:
                savedJob.description,

              jobType:
                savedJob.jobType,

              workMode:
                savedJob.workMode,

              salary:
                savedJob.salary,

              applicationUrl:
                savedJob.applicationUrl,

              postedAt:
                savedJob.postedAt,
            },
          });
        }
      }
    }

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