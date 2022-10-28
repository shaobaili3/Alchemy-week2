const  qs = require('qs');

async function connect() {
  /** MetaMask injects a global API into websites visited by its users at `window.ethereum`. This API allows websites to request users' Ethereum accounts, read data from blockchains the user is connected to, and suggest that the user sign messages and transactions. The presence of the provider object indicates an Ethereum user. Read more: https://ethereum.stackexchange.com/a/68294/85979**/

  // Check if MetaMask is installed, if it is, try connecting to an account
  if (typeof window.ethereum !== "undefined") {
    try {
      console.log("connecting");
      // Requests that the user provides an Ethereum address to be identified by. The request causes a MetaMask popup to appear. Read more: https://docs.metamask.io/guide/rpc-api.html#eth-requestaccounts
      await ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
      console.log(error);
    }
    // If connected, change button to "Connected"
    document.getElementById("login_button").innerHTML = "Connected";
    // If connected, enable "Swap" button
    document.getElementById("swap_button").disabled = false;
  }
  // Ask user to install MetaMask if it's not detected
  else {
    document.getElementById("login_button").innerHTML =
      "Please install MetaMask";
  }
}

function closeModal() {
  document.getElementById("token_modal").style.display = "none";
}

async function listAvailableTokens() {
  console.log("initializing");
  let response = await fetch("https://tokens.coingecko.com/uniswap/all.json");
  let tokenListJSON = await response.json();
  console.log("listing available tokens: ", tokenListJSON);
  tokens = tokenListJSON.tokens;
  console.log("tokens:", tokens);

  // Create a token list for the modal
  let parent = document.getElementById("token_list");
  // Loop through all the tokens inside the token list JSON object
  for (const i in tokens) {
    // Create a row for each token in the list
    let div = document.createElement("div");
    div.className = "token_row";
    // For each row, display the token image and symbol
    let html = `
        <img class="token_list_img" src="${tokens[i].logoURI}">
        <span class="token_list_text">${tokens[i].symbol}</span>
        `;
    div.innerHTML = html;
    div.onclick = () => {
      selectToken(tokens[i]);
    };
    parent.appendChild(div);
  }
}

function openModal(side) {
  // Store whether the user has selected a token on the from or to side
  currentSelectSide = side;
  document.getElementById("token_modal").style.display = "block";
}

function selectToken(token) {
  closeModal();
  currentTrade[currentSelectSide] = token;
  console.log("currentTrade:", currentTrade);
  renderInterface();
}

function renderInterface() {
  console.log("token selected ##########");
  if (currentTrade.from) {
    console.log(currentTrade.from);
    // Set the from token image
    document.getElementById("from_token_img").src = currentTrade.from.logoURI;
    // Set the from token symbol text
    document.getElementById("from_token_text").innerHTML =
      currentTrade.from.symbol;
  }
  if (currentTrade.to) {
    // Set the to token image
    document.getElementById("to_token_img").src = currentTrade.to.logoURI;
    // Set the to token symbol text
    document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
  }
}

async function getPrice() {
  console.log("Getting Price");
  // Only fetch price if from token, to token, and from token amount have been filled in
  if (
    !currentTrade.from ||
    !currentTrade.to ||
    !document.getElementById("from_amount").value
  )
    return;
  // The amount is calculated from the smallest base unit of the token. We get this by multiplying the (from amount) x (10 to the power of the number of decimal places)
  let amount = Number(
    document.getElementById("from_amount").value *
      10 ** currentTrade.from.decimals
  );

  const params = {
      sellToken: currentTrade.from.address,
      buyToken: currentTrade.to.address,
      sellAmount: amount,
    }
    // Fetch the swap price.
    const response = await fetch(
      `https://api.0x.org/swap/v1/price?${qs.stringify(params)}`
      );

    // Await and parse the JSON response 
    swapPriceJSON = await  response.json();
    console.log("Price: ", swapPriceJSON);
    // Use the returned values to populate the buy Amount and the estimated gas in the UI
    document.getElementById("to_amount").value = swapPriceJSON.buyAmount / (10 ** currentTrade.to.decimals);
    document.getElementById("gas_estimate").innerHTML = swapPriceJSON.estimatedGas;    
}

async function init() {
  console.log("init called");
  listAvailableTokens();
}

let currentTrade = {};
let currentSelectSide;
init();

document.getElementById("login_button").onclick = connect;
document.getElementById("login_button").onclick = connect;
document.getElementById("from_token_select").onclick = openModal;
document.getElementById("to_token_select").onclick = openModal;
document.getElementById("modal_close").onclick = closeModal;
document.getElementById("from_token_select").onclick = openModal;
document.getElementById("modal_close").onclick = closeModal;
document.getElementById("from_amount").onblur = getPrice;
document.getElementById("from_token_select").onclick = () => {
  openModal("from");
};
document.getElementById("to_token_select").onclick = () => {
  openModal("to");
};
