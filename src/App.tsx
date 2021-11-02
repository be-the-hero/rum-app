import React from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { StoreProvider } from 'store';
import { ipcRenderer } from 'electron';

import Sidebar from 'layouts/Sidebar';
import Producer from 'pages/Producer';
import Exchange from 'pages/Exchange';
import Balance from 'pages/Balance';
import Transaction from 'pages/Transaction';
import Account from 'pages/Account';

ipcRenderer.on('error', (err) => {
  console.log(err);
});

export default () => {
  return (
    <StoreProvider>
      <Router>
        <div className="flex">
          <Sidebar />
          <div className="flex-1">
            <Switch>
              <Route path="/" exact component={Producer} />
              <Route path="/exchange" component={Exchange} />
              <Route path="/balance" component={Balance} />
              <Route path="/transaction" component={Transaction} />
              <Route path="/account" component={Account} />
            </Switch>
          </div>
        </div>
      </Router>
    </StoreProvider>
  );
};
