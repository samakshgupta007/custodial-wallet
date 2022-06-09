import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { PlaidLink } from 'react-plaid-link';
import axios from 'axios';
import { logoutUser } from "../../actions/authActions";
import { setAccounts, addAccount } from "../../actions/accountActions";

import Accounts from "./Accounts";
import Spinner from "./Spinner";

class Dashboard extends Component {

  constructor(props) {
    super(props);
    this.state = { token: null,  access_token: null };
  }

  async componentDidMount() {
    axios.get('http://localhost:5000/api/plaid/accounts')
    .then((res) => {
      this.props.plaid.accounts = res.data;
      this.props.setAccounts(res.data);
    })
    axios.post('http://localhost:5000/api/plaid/create_link_token')
    .then((response) => {
      this.setState({ token: response.data.link_token });
    })
  }

  onSuccess = async (publicToken, metadata) => {
    const res = await axios.post('http://localhost:5000/api/plaid/exchange-public-token', { public_token: publicToken })
    this.setState({ access_token: res.data.access_token })
    const plaidData = {
      public_token: publicToken,
      accessToken: res.data.access_token,
      itemId: res.data.item_id,
      metadata,
    };
    this.props.addAccount(plaidData);
  };

  onEvent = (eventName, metadata) => {
    console.log(eventName, metadata);
  };

  onExit = (error, metadata) => {
    console.log(error, metadata);
  };

  // Logout
  onLogoutClick = e => {
    e.preventDefault();
    this.props.logoutUser();
  };

  render() {
    const { user } = this.props.auth;
    const { accounts, accountsLoading } = this.props.plaid;

    let dashboardContent;

    if (accounts === null || accountsLoading) {
      dashboardContent = <Spinner />;
    } else if (accounts.length > 0) {
      // User has accounts linked
      dashboardContent = <Accounts user={user} accounts={accounts} />;
    } else {
      // User has no accounts linked
      dashboardContent = (
        <div className="row">
          <div className="col s12 center-align">
            <h4>
              <b>Welcome,</b> {user.name.split(" ")[0]}
            </h4>
            <p className="flow-text grey-text text-darken-1">
              To get started, link your first bank account below
            </p>
            <div>
            <PlaidLink
              className="btn btn-large waves-effect waves-light hoverable blue accent-3 main-btn"
              style={{ padding: '0 20px', fontSize: '16px', cursor: 'pointer' }}
              token={this.state.token}
              onSuccess={this.onSuccess}
              onEvent={this.onEvent}
              onExit={this.onExit}
            >
              Link Account
            </PlaidLink>
            </div>
            <button
              onClick={this.onLogoutClick}
              className="btn btn-large waves-effect waves-light hoverable red accent-3 main-btn"
            >
              Logout
            </button>
          </div>
        </div>
      );
    }

    return <div className="container">{dashboardContent}</div>;
  }
}

Dashboard.propTypes = {
  logoutUser: PropTypes.func.isRequired,
  setAccounts: PropTypes.func.isRequired,
  addAccount: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  plaid: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  auth: state.auth,
  plaid: state.plaid
});

export default connect(
  mapStateToProps,
  { logoutUser, setAccounts, addAccount }
)(Dashboard);
