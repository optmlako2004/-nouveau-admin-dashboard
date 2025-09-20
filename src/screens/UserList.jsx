// src/screens/UserList.jsx

import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = getDocs(collection(db, "users"));
        const driversQuery = getDocs(collection(db, "drivers"));
        const [usersSnapshot, driversSnapshot] = await Promise.all([
          usersQuery,
          driversQuery,
        ]);

        const clients = usersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            displayName: `${data.prenom || ""} ${data.nom || ""}`.trim(),
            type: "Client",
          };
        });

        const pros = driversSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            displayName:
              data.nomFoodtruck !== "Nom à définir"
                ? data.nomFoodtruck
                : "Pro sans nom",
            type: "Pro",
          };
        });

        const combinedUsers = [...clients, ...pros].sort((a, b) =>
          (a.displayName || "").localeCompare(b.displayName || "")
        );
        setUsers(combinedUsers);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des utilisateurs:",
          error
        );
        setSnackbar({
          open: true,
          message: "Erreur de récupération des utilisateurs.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleContactUser = async () => {
    if (!selectedUser) return;
    const chatDocRef = doc(db, "supportChats", selectedUser.id);
    try {
      await setDoc(
        chatDocRef,
        {
          lastMessageTimestamp: serverTimestamp(),
          type: selectedUser.type,
          userEmail: selectedUser.email,
          status: "open",
          ...(selectedUser.type === "Pro"
            ? { proId: selectedUser.id, proName: selectedUser.displayName }
            : { userId: selectedUser.id, userName: selectedUser.displayName }),
        },
        { merge: true }
      );
      navigate("/dashboard/support");
    } catch (error) {
      console.error("Erreur lors de la création de la conversation:", error);
      setSnackbar({
        open: true,
        message: "Impossible de démarrer la conversation.",
        severity: "error",
      });
    }
    handleMenuClose();
  };

  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;
    const collectionName = selectedUser.type === "Pro" ? "drivers" : "users";
    const userRef = doc(db, collectionName, selectedUser.id);
    try {
      const newStatus = !selectedUser.disabled;
      await updateDoc(userRef, {
        disabled: newStatus,
      });
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id ? { ...u, disabled: newStatus } : u
        )
      );
      setSnackbar({
        open: true,
        message: "Statut de l'utilisateur mis à jour.",
        severity: "success",
      });
    } catch (error) {
      console.error("Erreur de mise à jour du statut:", error);
      setSnackbar({
        open: true,
        message: "Erreur lors de la mise à jour.",
        severity: "error",
      });
    }
    handleMenuClose();
  };

  const handleManageAdminRole = async (makeAdmin) => {
    if (!selectedUser) return;
    const manageAdminRole = httpsCallable(functions, "manageAdminRole");
    try {
      const result = await manageAdminRole({
        email: selectedUser.email,
        makeAdmin: makeAdmin,
        userType: selectedUser.type,
      });
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id ? { ...u, isAdmin: makeAdmin } : u
        )
      );
      setSnackbar({
        open: true,
        message: result.data.message,
        severity: "success",
      });
    } catch (error) {
      console.error("Erreur lors de la gestion du rôle admin:", error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: "error",
      });
    }
    handleMenuClose();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const menuActions = (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleContactUser}>Contacter</MenuItem>
      <MenuItem onClick={handleToggleUserStatus}>
        {selectedUser?.disabled ? "Activer le compte" : "Désactiver le compte"}
      </MenuItem>
      {selectedUser?.isAdmin ? (
        <MenuItem onClick={() => handleManageAdminRole(false)}>
          Révoquer Admin
        </MenuItem>
      ) : (
        <MenuItem onClick={() => handleManageAdminRole(true)}>
          Nommer Admin
        </MenuItem>
      )}
    </Menu>
  );

  // Si c'est un mobile, on affiche une liste de cartes
  if (isMobile) {
    return (
      <Paper>
        <Typography variant="h4" sx={{ p: 2, pb: 1 }}>
          Gestion des Utilisateurs
        </Typography>
        <List sx={{ p: 0 }}>
          {users.map((user) => (
            <React.Fragment key={user.id}>
              <ListItem
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={(e) => handleMenuClick(e, user)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 1,
                        mr: 4,
                      }}
                    >
                      {user.isAdmin && (
                        <AdminPanelSettingsIcon
                          color="primary"
                          sx={{ mr: 1, fontSize: 20 }}
                        />
                      )}
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: "bold" }}
                        noWrap
                      >
                        {user.displayName || "Non défini"}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        noWrap
                      >
                        {user.email}
                      </Typography>
                      <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                        <Chip
                          label={user.type}
                          color={user.type === "Pro" ? "primary" : "secondary"}
                          size="small"
                        />
                        <Chip
                          label={user.disabled ? "Désactivé" : "Actif"}
                          color={user.disabled ? "error" : "success"}
                          size="small"
                        />
                      </Box>
                    </>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
        {menuActions}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    );
  }

  // Sinon (grand écran), on affiche le tableau
  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <Typography variant="h4" sx={{ p: 2 }}>
        Gestion des Utilisateurs
      </Typography>
      <TableContainer sx={{ maxHeight: "calc(100vh - 220px)" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Nom d'affichage</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow hover key={user.id}>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {user.isAdmin && (
                      <AdminPanelSettingsIcon color="primary" sx={{ mr: 1 }} />
                    )}
                    {user.displayName || user.email || "Non défini"}
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.type}
                    color={user.type === "Pro" ? "primary" : "secondary"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.disabled ? "Désactivé" : "Actif"}
                    color={user.disabled ? "error" : "success"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={(e) => handleMenuClick(e, user)}>
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {menuActions}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
