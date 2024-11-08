import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import rehypeRaw from "rehype-raw";

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
import FavoriteIcon from "@mui/icons-material/Favorite";
import SendIcon from "@mui/icons-material/Send";

import { fetchChatGPTResponse } from "./api";
import "./App.css";

const App = () => {
  const [codeInput, setCodeInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [placeholder, setPlaceholder] = useState("코드를 입력해 주세요.");
  const messageContainerRef = useRef(null);

  const handleCodeChange = (event) => {
    setCodeInput(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setOpenSnackbar(false);
    setDisabled(true);

    const userMessage = {
      sender: "user",
      text: `\`\`\`javascript\n${codeInput}\n\`\`\``
    };
    const loadingMessage = { sender: "bot", text: "..." };

    setMessages([...messages, userMessage, loadingMessage]);
    setCodeInput(""); // 입력 값 초기화

    try {
      let chatGPTResponse = await fetchChatGPTResponse(codeInput);
      chatGPTResponse += chatGPTResponse.includes("###") ? "<button />" : "";
      const botMessage = {
        sender: "bot",
        text: chatGPTResponse
      };
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.text === "..." ? botMessage : msg))
      );
    } catch (error) {
      setError("Error processing code");
      setOpenSnackbar(true);
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.text !== "...")
      );
    } finally {
      setDisabled(false);
    }
  };

  const handleWrite = async (msg) => {
    setDisabled(true);

    const title = prompt("작성될 글의 제목을 입력해 주세요:");

    if (!title) {
      alert("제목이 입력되지 않았습니다. 다시 시도해 주세요.");
      return;
    }

    try {
      setPlaceholder("Markdown으로 작성된 표의 형식을 변환하고 있습니다.");
      // 표를 XML/XHTML 형태로 변경
      const value = await fetchChatGPTResponse(msg, true);

      setPlaceholder("컨플루언스에 업로드 중입니다.");
      const response = await fetch("/api/rest/api/content", {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(
            `${process.env.REACT_APP_CONFLUENCE_USER_NAME}:${process.env.REACT_APP_CONFLUENCE_API_KEY}`
          )}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "page",
          title,
          space: { key: process.env.REACT_APP_CONFLUENCE_SPACE_KEY },
          ancestors: [{ id: "3564306438" }],
          body: {
            storage: {
              value,
              representation: "storage"
            }
          }
        })
      });
      if (!response.ok)
        throw "잘못된 요청입니다. 제목이 중복되었을 수 있으니 다시 시도해 주세요.";

      alert("컨플루언스에 게시글이 업로드 되었습니다!");
    } catch (e) {
      alert(e);
    } finally {
      setDisabled(false);
      setPlaceholder("코드를 입력해 주세요.");
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
        <p>코드를 제공해 보세요. 당신이 작성한 코드를 정리해 드립니다.</p>
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
                    rehypePlugins={[rehypeRaw]}
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
                      },
                      button: ({ node, ...props }) => (
                        <>
                          <br />
                          <br />
                          <span
                            {...props}
                            onClick={() => handleWrite(message.text)}
                          >
                            Export to Confluence
                          </span>
                        </>
                      )
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
              disabled={disabled}
              onChange={handleCodeChange}
              color="error"
              onKeyPress={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
              placeholder={placeholder}
              fullWidth
              variant="outlined"
              className="input-field"
              sx={{
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "red"
                },
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                  {
                    borderWidth: "1px",
                    borderColor: "red"
                  },
                "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: "red"
                  },
                "& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: "red"
                  }
              }}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{ ml: 2 }}
              className="button-send"
              disabled={disabled}
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
