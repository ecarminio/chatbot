import { useState } from "react";
import Chatbot from "./Chatbot"; // Import the Chatbot component
import "./App.css";

function App() {
  return (
    <div className="container">
      <nav>
        <h1>bit.</h1>
        
      </nav>

      <Chatbot /> {/* Add the chatbot here */}
      <p className="footer">All rights reserved &copy; bit. 2025</p>

    </div>
  );
}

export default App;
