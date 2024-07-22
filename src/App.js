import React, { useState, useRef, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Snackbar,
  Alert,
  Avatar
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchChatGPTResponse } from "./api";
import "./App.css";

const App = () => {
  const [codeInput, setCodeInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const messageContainerRef = useRef(null);

  const handleCodeChange = (event) => {
    setCodeInput(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setOpenSnackbar(false);

    const userMessage = {
      sender: "user",
      text: `\`\`\`javascript\n${codeInput}\n\`\`\``
    };
    const loadingMessage = { sender: "bot", text: "..." };

    setMessages([...messages, userMessage, loadingMessage]);
    setCodeInput(""); // 입력 값 초기화

    try {
      const chatGPTResponse = await fetchChatGPTResponse(codeInput);
      const botMessage = { sender: "bot", text: chatGPTResponse };
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.text === "..." ? botMessage : msg))
      );
    } catch (error) {
      setError("Error processing code");
      setOpenSnackbar(true);
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.text !== "...")
      );
    }
  };

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={3}
        sx={{ padding: 3, borderRadius: 3 }}
        className="app-card"
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Avatar className="avatar">
            <FavoriteIcon />
          </Avatar>
          <Typography variant="h4" component="h1">
            <b>DD</b> (Document for Developer)
          </Typography>
        </Box>
        <p>코드를 제공해 보세요. 당신이 작성한 코드를 표로 정리해 드립니다.</p>
        <Box
          sx={{ mb: 3, maxHeight: "500px", overflowY: "auto" }}
          className="message-container"
          ref={messageContainerRef}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              className={`message ${message.sender}`}
              sx={{
                display: "flex",
                justifyContent:
                  message.sender === "user" ? "flex-end" : "flex-start",
                mb: 2
              }}
            >
              <Paper
                sx={{
                  padding: 2,
                  borderRadius: 2,
                  maxWidth: "70%",
                  minWidth: "200px"
                }}
                className="message-bubble"
              >
                <Box className="markdown-container">
                  <ReactMarkdown
                    children={message.text}
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        return !inline ? (
                          <pre className={className} {...props}>
                            {children}
                          </pre>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  />
                </Box>
              </Paper>
            </Box>
          ))}
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <TextField
              multiline
              rows={2}
              value={codeInput}
              onChange={handleCodeChange}
              color="error"
              onKeyPress={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
              placeholder="코드를 입력해주세요."
              fullWidth
              variant="outlined"
              className="input-field"
            />
            <Button
              type="submit"
              variant="contained"
              sx={{ ml: 2 }}
              className="button-send"
            >
              <SendIcon />
            </Button>
          </Box>
        </form>
      </Paper>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default App;
