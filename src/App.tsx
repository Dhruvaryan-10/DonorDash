import React from 'react';
import Home from './components/Home';
import Navbar from './components/Navbar';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <Navbar/>
      <Home />
    </div>
  );
};

export default App;