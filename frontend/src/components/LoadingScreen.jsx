import "./LoadingScreen.css";

function LoadingScreen({ message = "Loading Careerly..." }) {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-brand">Careerly</div>

        <div className="loading-spinner">
          <span />
          <span />
          <span />
        </div>

        <p>{message}</p>
      </div>
    </div>
  );
}

export default LoadingScreen;