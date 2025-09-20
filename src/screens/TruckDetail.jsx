// src/screens/TruckDetail.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Modal,
  TextField,
} from "@mui/material";
// --- CORRECTED IMPORT ---
import SendIcon from "@mui/icons-material/Send";
// --- END CORRECTION ---

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const getReservationStatusChip = (status) => {
  switch (status) {
    case "accepted":
      return <Chip label="Acceptée" color="success" size="small" />;
    case "refused":
      return <Chip label="Refusée" color="error" size="small" />;
    case "pending":
    default:
      return <Chip label="En attente" color="warning" size="small" />;
  }
};

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

export default function TruckDetail() {
  const { truckId } = useParams();
  const navigate = useNavigate();
  const [truck, setTruck] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

  const [openContactModal, setOpenContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchTruckData = async () => {
      try {
        const truckDocRef = doc(db, "drivers", truckId);
        const truckDoc = await getDoc(truckDocRef);
        if (truckDoc.exists()) {
          setTruck({ id: truckDoc.id, ...truckDoc.data() });
        }

        const ordersQuery = query(
          collection(db, "orders"),
          where("foodTruckId", "==", truckId),
          orderBy("createdAt", "desc")
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        setOrders(
          ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );

        const reservationsQuery = query(
          collection(db, "reservations"),
          where("foodTruckId", "==", truckId),
          orderBy("createdAt", "desc")
        );
        const reservationsSnapshot = await getDocs(reservationsQuery);
        setReservations(
          reservationsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } catch (error) {
        console.error("Erreur de récupération des détails:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTruckData();
  }, [truckId]);

  // --- CORRIGÉ ---
  // L'envoi de message ré-ouvre la conversation si elle était fermée
  const handleSendMessageToPro = async () => {
    if (!contactMessage.trim() || !truck) return;
    setIsSending(true);

    const chatDocRef = doc(db, "supportChats", truck.id);
    const messagesRef = collection(chatDocRef, "messages");

    try {
      await addDoc(messagesRef, {
        text: contactMessage,
        createdAt: serverTimestamp(),
        senderId: "admin",
      });

      await setDoc(
        chatDocRef,
        {
          lastMessage: contactMessage,
          lastMessageTimestamp: serverTimestamp(),
          unreadByUser: true,
          unreadByPro: true, // On met les deux à true pour être sûr
          proId: truck.id,
          proName: truck.nomFoodtruck,
          userEmail: truck.email,
          type: "Pro",
          unreadByAdmin: false,
          status: "open", // <-- CORRECTION CLÉ : On force la ré-ouverture
        },
        { merge: true }
      );

      setOpenContactModal(false);
      setContactMessage("");
      navigate("/support"); // Redirige vers la page de support
    } catch (error) {
      console.error("Erreur d'envoi du message:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!truck) {
    return <Typography variant="h5">Food Truck introuvable.</Typography>;
  }

  return (
    <>
      <Paper>
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Typography variant="h4">{truck.nomFoodtruck}</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {truck.email}
            </Typography>
          </div>
          <Button variant="contained" onClick={() => setOpenContactModal(true)}>
            Contacter le Pro
          </Button>
        </Box>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabIndex}
            onChange={(e, newValue) => setTabIndex(newValue)}
          >
            <Tab label={`Commandes (${orders.length})`} />
            <Tab label={`Réservations (${reservations.length})`} />
          </Tabs>
        </Box>

        <TabPanel value={tabIndex} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Client</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.userName}</TableCell>
                    <TableCell>
                      {new Date(
                        order.createdAt?.seconds * 1000
                      ).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>{order.totalPrice.toFixed(2)} €</TableCell>
                    <TableCell>{order.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabIndex} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Client</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Date de l'événement</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reservations.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell>{res.userName}</TableCell>
                    <TableCell>{res.userEmail}</TableCell>
                    <TableCell>
                      {new Date(
                        res.eventDate?.seconds * 1000
                      ).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      {getReservationStatusChip(res.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      <Modal open={openContactModal} onClose={() => setOpenContactModal(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2">
            Message à {truck.nomFoodtruck}
          </Typography>
          <TextField
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            placeholder="Écrivez votre message ici..."
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleSendMessageToPro}
            disabled={isSending || !contactMessage.trim()}
            startIcon={
              isSending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SendIcon />
              )
            }
          >
            Envoyer
          </Button>
        </Box>
      </Modal>
    </>
  );
}
