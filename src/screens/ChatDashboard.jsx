// src/screens/ChatDashboard.jsx

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
  updateDoc,
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
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PersonIcon from "@mui/icons-material/Person";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const ChatList = ({ chats, selectedChat, onSelectChat }) => (
  <List sx={{ p: 0, height: "100%", overflowY: "auto" }}>
    {chats.map((chat) => (
      <React.Fragment key={chat.id}>
        <ListItemButton
          onClick={() => onSelectChat(chat)}
          selected={selectedChat?.id === chat.id}
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
              <Typography noWrap variant="body2" color="text.secondary">
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        unreadByPro: true,
        unreadByAdmin: false,
        status: "open",
      },
      { merge: true }
    );
    setNewMessage("");
  };

  const handleTerminateChat = async () => {
    if (!selectedChat) return;
    const chatDocRef = doc(db, "supportChats", selectedChat.id);
    await updateDoc(chatDocRef, { status: "closed" });
    setSelectedChat({ ...selectedChat, status: "closed" });
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

  const showChatList = !isMobile || (isMobile && !selectedChat);
  const showChatWindow = !isMobile || (isMobile && selectedChat);

  return (
    <Grid
      container
      component={Paper}
      sx={{ width: "100%", height: "calc(100vh - 120px)" }}
    >
      {showChatList && (
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            borderRight: { md: "1px solid #ddd" },
            display: "flex",
            flexDirection: "column",
            height: "100%",
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
      )}

      {showChatWindow && (
        <Grid
          item
          xs={12}
          md={8}
          sx={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          {selectedChat ? (
            <>
              <Box
                sx={{
                  p: 2,
                  borderBottom: "1px solid #ddd",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {isMobile && (
                    <IconButton
                      onClick={() => setSelectedChat(null)}
                      sx={{ mr: 1 }}
                    >
                      <ArrowBackIcon />
                    </IconButton>
                  )}
                  <div>
                    <Typography variant="h6">
                      {selectedChat.proName || selectedChat.userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedChat.userEmail}
                    </Typography>
                  </div>
                </Box>
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
      )}
    </Grid>
  );
}
