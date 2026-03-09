import React, { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { getTabId } from "./GetMetaData";

function App() {

  const [connection, setConnection] = useState(null);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [tabId] = useState(getTabId());

  useEffect(() => {
  const newConnection = new signalR.HubConnectionBuilder()
    .withUrl(`https://localhost:7247/hub/rulehub?tabId=${tabId}`)
    .withAutomaticReconnect()
    .build();

  setConnection(newConnection);

  }, [tabId]);

  useEffect(() => {

    if (connection) {

      connection.start()
        .then(() => {

          console.log("Connected to SignalR");

          connection.on("piiResult", (result) => {

            setMessages(prev => [...prev, result]);

          });

        })
        .catch(err => console.error(err));

    }

  }, [connection]);

  const sendRequest = async () => {

    await fetch("https://localhost:7247/api/pii", {
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

  };

  return (
    <div style={{ padding: 40 }}>

      <h2>PII Detection Client</h2>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text"
      />

      <button onClick={sendRequest}>Send</button>

      <h3>Results</h3>

      <ul>

        {messages.map((m, index) => (
          <li key={index}>
            <label style = {{ color: m.containsPII ? "red" : "green" }}>
              {m.containsPII ? "PII Detected" : "No PII Detected"}
            </label>
            |
           Prompt: <span style={{ color: m.containsPII ? "red" : "blue" }}>{m.rawPrompt}</span> | 
           ID: <span style={{ color: m.containsPII ? "red" : "blue" }}>{m.id}</span> | 
           ContainsPII:<span style={{ color: m.containsPII ? "red" : "blue" }}>{m.containsPII.toString()}</span> | 
           Message: <span style={{ color: m.containsPII ? "red" : "blue" }}>{m.message}</span>
          </li>
        ))}

      </ul>

    </div>
  );

}

export default App;