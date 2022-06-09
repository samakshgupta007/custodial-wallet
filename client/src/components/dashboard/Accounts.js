import React, { Component } from "react";
import PropTypes from "prop-types";
import axios from 'axios';
import { connect } from "react-redux";
import { PlaidLink } from 'react-plaid-link';
import {
  addAccount,
  deleteAccount,
} from "../../actions/accountActions";
import { logoutUser } from "../../actions/authActions";

class Accounts extends Component {

  constructor(props) {
    super(props);
    this.state = { token: null,  access_token: null };
  }

  componentDidMount() {
    axios.post('http://localhost:5000/api/plaid/create_link_token')
    .then((response) => {
      this.setState({ token: response.data.link_token });
    })

    const { accounts } = this.props;
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

  // Delete account
  onDeleteClick = id => {
    const { accounts } = this.props;
    const accountData = {
      id: id,
      accounts: accounts
    };
    this.props.deleteAccount(accountData);
  };

  // Logout
  onLogoutClick = e => {
    e.preventDefault();
    this.props.logoutUser();
  };

  render() {
    const { user, accounts } = this.props;

    let accountItems = accounts.map(account => (
      <li key={account._id} style={{ marginTop: "1rem" }}>
        <button
          style={{ marginRight: "1rem" }}
          onClick={this.onDeleteClick.bind(this, account._id)}
          className="btn btn-small btn-floating waves-effect waves-light hoverable red accent-3"
        >
          <i className="material-icons">delete</i>
        </button>
        <b>{account.institutionName}</b>
      </li>
    ));

    return (
      <div className="row">
        <div className="col s12">
          <button
            onClick={this.onLogoutClick}
            className="btn-flat waves-effect"
          >
            <i className="material-icons left">keyboard_backspace</i> Log Out
          </button>
          <h4>
            <b>Welcome!</b>
          </h4>
          <p className="grey-text text-darken-1">
            Hey there, {user.name.split(" ")[0]}
          </p>
          <h5>
            <b>Linked Accounts</b>
          </h5>
          <p className="grey-text text-darken-1">
            Add or remove your bank accounts below
          </p>
          <ul>{accountItems}</ul>
            <PlaidLink
              className="btn btn-large waves-effect waves-light hoverable blue accent-3 main-btn"
              style={{ padding: '0 20px', fontSize: '16px', cursor: 'pointer' }}
              token={this.state.token}
              onSuccess={this.onSuccess}
              onEvent={this.onEvent}
              onExit={this.onExit}
            >
              Link Bank Account
            </PlaidLink>
        </div>
      </div>
    );
  }
}

Accounts.propTypes = {
  logoutUser: PropTypes.func.isRequired,
  addAccount: PropTypes.func.isRequired,
  deleteAccount: PropTypes.func.isRequired,
  accounts: PropTypes.array.isRequired,
  plaid: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  plaid: state.plaid
});

export default connect(
  mapStateToProps,
  { logoutUser, addAccount, deleteAccount }
)(Accounts);
