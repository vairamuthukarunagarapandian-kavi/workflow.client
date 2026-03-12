import React, { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { getTabId } from "./GetMetaData";

const localUrl = "https://localhost:7247";

function App() {

  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [tabId] = useState(getTabId());
  // const requestIdRef = useRef(0);

  const connectionRef = useRef(null);

  // -----------------------------
  // SignalR Connection Setup
  // -----------------------------
  useEffect(() => {

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${localUrl}/hub/rulehub?tabId=${tabId}`)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.start()
      .then(() => {
        console.log("SignalR Connected");

        connection.on("piiResult", (result) => {
          setMessages(prev => [...prev, result]);
        });

        connection.on("ValidationResult", (result) => {
          console.log("Validation Result:", result);
        });

      })
      .catch(err => console.error("SignalR Error:", err));

    return () => {
      connection.stop();
    };

  }, [tabId]);

  // -----------------------------
  // Debounced Validation
  // -----------------------------
  const validatePrompt = useRef(
  debounce((text) => {

    const conn = connectionRef.current;
    if (!conn || conn.state !== "Connected") return;

    // const requestId = ++requestIdRef.current;

    conn.invoke("ValidatePrompt", text, tabId)
      .catch(err => console.error(err));

  }, 500)
).current;

  // -----------------------------
  // Input Change
  // -----------------------------
  const handleChange = (e) => {

    const value = e.target.value;

    setText(value);

    // optional optimization
    if (value.length > 2) {
      validatePrompt(value);
    }

  };

  // -----------------------------
  // Send API Request
  // -----------------------------
  const sendRequest = async () => {

    try {

      await fetch(`${localUrl}/api/pii`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: text,
          tabId: tabId
        })
      });

      setText("");

    } catch (err) {
      console.error(err);
    }

  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div style={{ padding: 40 }}>

      <h2>PII Detection Client</h2>

      <input
        value={text}
        onChange={handleChange}
        placeholder="Enter text"
        style={{ width: 400, padding: 8 }}
      />

      <button onClick={sendRequest} style={{ marginLeft: 10 }}>
        Send
      </button>

      <h3>Results</h3>

      <ul>

        {messages.map((m, index) => (

          <li key={index}>

            <label style={{ color: m.containsPII ? "red" : "green" }}>
              {m.containsPII ? "PII Detected" : "No PII Detected"}
            </label>

            {" | "}

            Prompt:
            <span style={{ color: m.containsPII ? "red" : "blue" }}>
              {m.rawPrompt}
            </span>

            {" | "}

            ID:
            <span style={{ color: m.containsPII ? "red" : "blue" }}>
              {m.id}
            </span>

            {" | "}

            ContainsPII:
            <span style={{ color: m.containsPII ? "red" : "blue" }}>
              {m.containsPII.toString()}
            </span>

            {" | "}

            Message:
            <span style={{ color: m.containsPII ? "red" : "blue" }}>
              {m.message}
            </span>

          </li>

        ))}

      </ul>

    </div>
  );

}

// -----------------------------
// Debounce Utility
// -----------------------------
function debounce(fn, delay) {

  let timer;

  return function (...args) {

    clearTimeout(timer);

    timer = setTimeout(() => {
      fn(...args);
    }, delay);

  };

}

export default App;