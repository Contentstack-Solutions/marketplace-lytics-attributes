const DefaultPage = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <div className="app-component-content">
          <p>Lytics Attributes. Are you trying to access any of the following paths?</p>
          <ul className="ui-location">
            <li>
              <a href="/custom-field">Custom Field</a>
            </li>
            <li>
              <a href="/app-configuration">App Configuration</a>
            </li>
            <li>
              <a href="/entry-sidebar">Entry Sidebar</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DefaultPage;
