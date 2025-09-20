// src/layouts/DashboardLayout.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Typography,
  Badge,
  useTheme,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleIcon from "@mui/icons-material/People";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import LogoutIcon from "@mui/icons-material/Logout";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

import logo from "../assets/icon.png";

const drawerWidth = 240;

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    users: 0,
    trucks: 0,
    support: 0,
  });

  // Listener pour les messages de support non lus
  useEffect(() => {
    const q = query(
      collection(db, "supportChats"),
      where("unreadByAdmin", "==", true)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications((prev) => ({ ...prev, support: snapshot.size }));
    });
    return () => unsubscribe();
  }, []);

  // Listener pour les nouvelles commandes et réservations
  useEffect(() => {
    const ordersQuery = query(
      collection(db, "orders"),
      where("viewedByAdmin", "==", false)
    );
    const reservationsQuery = query(
      collection(db, "reservations"),
      where("viewedByAdmin", "==", false)
    );

    let ordersCount = 0;
    let reservationsCount = 0;

    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      ordersCount = snapshot.size;
      setNotifications((prev) => ({
        ...prev,
        trucks: ordersCount + reservationsCount,
      }));
    });

    const unsubReservations = onSnapshot(reservationsQuery, (snapshot) => {
      reservationsCount = snapshot.size;
      setNotifications((prev) => ({
        ...prev,
        trucks: ordersCount + reservationsCount,
      }));
    });

    return () => {
      unsubOrders();
      unsubReservations();
    };
  }, []);

  // Listener pour les nouveaux utilisateurs (clients + pros)
  useEffect(() => {
    const usersQuery = query(
      collection(db, "users"),
      where("viewedByAdmin", "==", false)
    );
    const driversQuery = query(
      collection(db, "drivers"),
      where("viewedByAdmin", "==", false)
    );

    let usersCount = 0;
    let driversCount = 0;

    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      usersCount = snapshot.size;
      setNotifications((prev) => ({
        ...prev,
        users: usersCount + driversCount,
      }));
    });
    const unsubDrivers = onSnapshot(driversQuery, (snapshot) => {
      driversCount = snapshot.size;
      setNotifications((prev) => ({
        ...prev,
        users: usersCount + driversCount,
      }));
    });

    return () => {
      unsubUsers();
      unsubDrivers();
    };
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const menuItems = [
    {
      text: "Utilisateurs",
      icon: <PeopleIcon />,
      path: "/dashboard",
      notificationCount: notifications.users,
    },
    {
      text: "Food Trucks",
      icon: <TwoWheelerIcon />,
      path: "/dashboard/trucks",
      notificationCount: notifications.trucks,
    },
    {
      text: "Support",
      icon: <SupportAgentIcon />,
      path: "/dashboard/support",
      notificationCount: notifications.support,
    },
  ];

  const drawerContent = (
    <div>
      <Toolbar>
        <img src={logo} alt="Logo" style={{ height: 40, marginRight: 10 }} />
        <Typography variant="h6" color="primary">
          FoodTrucks
        </Typography>
      </Toolbar>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "calc(100vh - 64px)",
        }}
      >
        <List>
          {menuItems.map((item) => (
            <ListItem
              key={item.text}
              disablePadding
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
            >
              <ListItemButton selected={location.pathname === item.path}>
                <ListItemIcon sx={{ color: "primary.main" }}>
                  <Badge
                    color="error"
                    variant="dot"
                    invisible={item.notificationCount === 0}
                  >
                    {item.icon}
                  </Badge>
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <List>
          <ListItem disablePadding onClick={handleLogout}>
            <ListItemButton>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Déconnexion" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div">
            Tableau de Bord Admin
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 }, // Moins de padding sur les petits écrans
          width: { md: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: "background.default",
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
