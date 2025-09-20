import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";

import DashboardLayout from "./layouts/DashboardLayout.jsx";
import LoginScreen from "./screens/LoginScreen.jsx";
import UserList from "./screens/UserList.jsx";
import TruckList from "./screens/TruckList.jsx";
import TruckDetail from "./screens/TruckDetail.jsx"; // On importe la nouvelle page
import ChatDashboard from "./screens/ChatDashboard.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <UserList /> },
      { path: "trucks", element: <TruckList /> },
      // On ajoute la route pour le détail d'un truck
      { path: "trucks/:truckId", element: <TruckDetail /> },
      { path: "support", element: <ChatDashboard /> },
    ],
  },
  {
    path: "/login",
    element: <LoginScreen />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
