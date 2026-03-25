import React, { Suspense } from "react";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { MarketplaceAppProvider } from "../../common/providers/MarketplaceAppProvider";
import { Route, Routes } from "react-router-dom";

const AppConfiguration = React.lazy(() => import("../AppConfiguration/AppConfiguration"));
const EntrySidebar = React.lazy(() => import("../EntrySidebar/EntrySidebar"));
const DefaultPage = React.lazy(() => import("../index"));

function App() {
  return (
    <ErrorBoundary>
      <MarketplaceAppProvider>
        <Routes>
          <Route path="/" element={<DefaultPage />} />
          <Route
            path="/app-configuration"
            element={
              <Suspense>
                <AppConfiguration />
              </Suspense>
            }
          />
          <Route
            path="/entry-sidebar"
            element={
              <Suspense>
                <EntrySidebar />
              </Suspense>
            }
          />
        </Routes>
      </MarketplaceAppProvider>
    </ErrorBoundary>
  );
}

export default App;
