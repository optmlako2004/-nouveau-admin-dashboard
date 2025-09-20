// src/screens/ChatDashboard.js

import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  serverTimestamp,
  setDoc,
  updateDoc, // On importe updateDoc
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
  Box,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
  Divider,
  TextField,
  IconButton,
  CircularProgress,
  Badge,
  Avatar,
  ListItemAvatar,
  Button, // On importe le composant Button
} from "@mui/material";
// --- CORRECTED IMPORTS ---
import SendIcon from "@mui/icons-material/Send";
import PersonIcon from "@mui/icons-material/Person";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
// --- END CORRECTION ---

// Le composant pour la liste des chats reste utile
const ChatList = ({ chats, selectedChat, onSelectChat }) => (
  <List sx={{ p: 0, height: "100%", overflowY: "auto" }}>
    {chats.map((chat) => (
      <React.Fragment key={chat.id}>
        <ListItemButton
          onClick={() => onSelectChat(chat)}
          selected={selectedChat?.id === chat.id}
          // On grise la conversation si elle est fermée
          sx={{ opacity: chat.status === "closed" ? 0.6 : 1 }}
        >
          <ListItemAvatar>
            <Avatar
              sx={{
                bgcolor:
                  chat.type === "Pro" ? "primary.main" : "secondary.main",
              }}
            >
              {chat.type === "Pro" ? (
                <TwoWheelerIcon fontSize="small" />
              ) : (
                <PersonIcon fontSize="small" />
              )}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography
                noWrap
                sx={{ fontWeight: chat.unreadByAdmin ? "bold" : "normal" }}
              >
                {chat.proName || chat.userName || "Utilisateur inconnu"}
              </Typography>
            }
            secondary={
              <Typography
                noWrap
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: chat.unreadByAdmin ? "bold" : "normal" }}
              >
                {chat.lastMessage || "..."}
              </Typography>
            }
          />
          {chat.unreadByAdmin && <Badge color="primary" variant="dot" />}
        </ListItemButton>
        <Divider />
      </React.Fragment>
    ))}
  </List>
);

export default function ChatDashboard() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Écoute la collection unifiée "supportChats"
  useEffect(() => {
    const q = query(
      collection(db, "supportChats"),
      orderBy("lastMessageTimestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChats(chatData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Charge les messages de la conversation sélectionnée
  useEffect(() => {
    if (!selectedChat) return;

    const chatDocRef = doc(db, "supportChats", selectedChat.id);
    setDoc(chatDocRef, { unreadByAdmin: false }, { merge: true });

    const messagesRef = collection(chatDocRef, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [selectedChat]);

  // Fait défiler jusqu'au dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- CORRIGÉ ---
  // L'envoi de message ré-ouvre la conversation si elle était fermée
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const chatDocRef = doc(db, "supportChats", selectedChat.id);
    const messagesRef = collection(chatDocRef, "messages");

    await addDoc(messagesRef, {
      text: newMessage,
      createdAt: serverTimestamp(),
      senderId: "admin",
    });

    await setDoc(
      chatDocRef,
      {
        lastMessage: newMessage,
        lastMessageTimestamp: serverTimestamp(),
        unreadByUser: true,
        unreadByPro: true, // On met les deux à true pour être sûr
        unreadByAdmin: false,
        status: "open", // <-- CORRECTION CLÉ : On force la ré-ouverture
      },
      { merge: true }
    );
    setNewMessage("");
  };

  // --- NOUVEAU ---
  // Fonction pour permettre à l'admin de terminer la conversation
  const handleTerminateChat = async () => {
    if (!selectedChat) return;

    if (
      window.confirm(
        "Voulez-vous vraiment terminer cette conversation ? Le professionnel ne verra plus la bannière."
      )
    ) {
      const chatDocRef = doc(db, "supportChats", selectedChat.id);
      try {
        await updateDoc(chatDocRef, {
          status: "closed",
        });
        // Optionnel : Mettre à jour l'état local pour un retour visuel immédiat
        setSelectedChat({ ...selectedChat, status: "closed" });
      } catch (error) {
        console.error("Erreur lors de la fermeture du chat:", error);
        alert("Impossible de terminer la conversation.");
      }
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid
      container
      component={Paper}
      sx={{ width: "100%", height: "calc(100vh - 90px)" }}
    >
      {/* Colonne de la liste des conversations */}
      <Grid
        item
        xs={4}
        sx={{
          borderRight: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6">Conversations</Typography>
        </Box>
        <ChatList
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
        />
      </Grid>

      {/* Colonne de la conversation active */}
      <Grid item xs={8} sx={{ display: "flex", flexDirection: "column" }}>
        {selectedChat ? (
          <>
            {/* --- MODIFIÉ : Ajout du bouton Terminer --- */}
            <Box
              sx={{
                p: 2,
                borderBottom: "1px solid #ddd",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Typography variant="h6">
                  {selectedChat.proName || selectedChat.userName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedChat.userEmail}
                </Typography>
              </div>
              {selectedChat.status !== "closed" && (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleTerminateChat}
                >
                  Terminer
                </Button>
              )}
            </Box>
            <Box
              sx={{
                flexGrow: 1,
                overflowY: "auto",
                p: 2,
                backgroundColor: "#f9f9f9",
              }}
            >
              {messages.map((msg) => (
                <Box
                  key={msg.id}
                  sx={{
                    display: "flex",
                    justifyContent:
                      msg.senderId === "admin" ? "flex-end" : "flex-start",
                    mb: 2,
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      borderRadius:
                        msg.senderId === "admin"
                          ? "20px 20px 5px 20px"
                          : "20px 20px 20px 5px",
                      backgroundColor:
                        msg.senderId === "admin" ? "primary.main" : "white",
                      color: msg.senderId === "admin" ? "white" : "black",
                      maxWidth: "70%",
                    }}
                  >
                    <Typography variant="body1">{msg.text}</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        textAlign: "right",
                        color:
                          msg.senderId === "admin"
                            ? "rgba(255,255,255,0.7)"
                            : "#aaa",
                        mt: 0.5,
                      }}
                    >
                      {msg.createdAt
                        ? new Date(
                            msg.createdAt.seconds * 1000
                          ).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </Typography>
                  </Paper>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>
            {/* On désactive le champ de réponse si la conversation est fermée */}
            <Box
              component="form"
              onSubmit={handleSendMessage}
              sx={{
                p: 1,
                display: "flex",
                borderTop: "1px solid #ddd",
                backgroundColor: "#fff",
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder={
                  selectedChat.status === "closed"
                    ? "Cette conversation est terminée."
                    : "Répondre..."
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                size="small"
                autoComplete="off"
                disabled={selectedChat.status === "closed"}
              />
              <IconButton
                type="submit"
                color="primary"
                disabled={
                  !newMessage.trim() || selectedChat.status === "closed"
                }
              >
                <SendIcon />
              </IconButton>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Sélectionnez une conversation pour commencer
            </Typography>
          </Box>
        )}
      </Grid>
    </Grid>
  );
}
