import axios from "axios";

import {
  ADD_ACCOUNT,
  DELETE_ACCOUNT,
  GET_ACCOUNTS,
  ACCOUNTS_LOADING,
  GET_TRANSACTIONS,
  TRANSACTIONS_LOADING,
  GET_ACCESS_TOKEN,
} from "./types";

// Get Access Token
export const getAccessToken = publicToken => dispatch => {
  axios
    .post("/api/plaid/get_access_token", publicToken)
    .then(res => {
      dispatch({
        type: GET_ACCESS_TOKEN,
        payload: res.data
      })
    })
    .catch(err => console.log(err));
};

// Add account
export const addAccount = plaidData => dispatch => {
  const accounts = plaidData.accounts;
  axios
    .post("/api/plaid/accounts/add", plaidData)
    .then(res =>
      dispatch({
        type: ADD_ACCOUNT,
        payload: res.data
      })
    )
    .catch(err => console.log(err));
};

// Delete account
export const deleteAccount = plaidData => dispatch => {
  if (window.confirm("Are you sure you want to remove this account?")) {
    const id = plaidData.id;
    const newAccounts = plaidData.accounts.filter(
      account => account._id !== id
    );
    axios
      .delete(`/api/plaid/accounts/${id}`)
      .then(res =>
        dispatch({
          type: DELETE_ACCOUNT,
          payload: id
        })
      )
      .catch(err => console.log(err));
  }
};

// Get all accounts for specific user
export const setAccounts = (data) => dispatch => {
  dispatch({
    type: GET_ACCOUNTS,
    payload: data
  })
};

// Accounts loading
export const setAccountsLoading = () => {
  return {
    type: ACCOUNTS_LOADING
  };
};
