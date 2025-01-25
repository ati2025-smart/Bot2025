const axios = require('axios');
const Web3 = require('web3');
const { ethers } = require('ethers');

// CoinGecko API key and endpoint
const API_KEY = 'CG-DYHiuSKLNXpYJ68dpiquqn3U';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Ethereum/Polygon Provider
const provider = new Web3.providers.HttpProvider('https://polygon-rpc.com');
const web3 = new Web3(provider);
const providerEth = new ethers.JsonRpcProvider('https://polygon-rpc.com');

// Smart Contract ABI and address
const contractABI = require('./ArbitrageBotABI.json');  // ABI of your deployed contract
const contractAddress = "YOUR_CONTRACT_ADDRESS";
const walletPrivateKey = "YOUR_WALLET_PRIVATE_KEY";  // Private key of the wallet to interact with the contract

// Setup the wallet and contract instance
const wallet = new ethers.Wallet(walletPrivateKey, providerEth);
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

// CoinGecko API function to fetch the top tokens dynamically
async function getTopTokens() {
    try {
        const response = await axios.get(`${COINGECKO_API}/coins/markets`, {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 30,
                page: 1,
                sparkline: false
            }
        });

        // Get the top 30 tokens from CoinGecko
        const tokens = response.data.map(token => ({
            address: token.id, // Assuming the token ID can be used for its address in the contract
            name: token.name,
            symbol: token.symbol,
            marketCap: token.market_cap,
            liquidity: token.total_supply // Simplified, you can adjust for actual liquidity data
        }));

        return tokens;
    } catch (error) {
        console.error('Error fetching top tokens:', error);
    }
}

// Function to execute arbitrage when a profitable opportunity is found
async function executeArbitrage(tokenA, tokenB, amountIn) {
    const tokenAddressA = tokenA.address;
    const tokenAddressB = tokenB.address;

    const amountInWei = web3.utils.toWei(amountIn.toString(), 'ether');

    // Approve tokenA on SushiSwap and QuickSwap
    const tokenAContract = new web3.eth.Contract(ERC20_ABI, tokenAddressA);
    await tokenAContract.methods.approve(contractAddress, amountInWei).send({ from: wallet.address });

    // Execute arbitrage on the smart contract
    const tx = await contract.executeArbitrage(amountInWei, tokenAddressA, tokenAddressB);
    console.log('Arbitrage transaction sent:', tx);
}

// Main function to run the bot
async function runArbitrageBot() {
    const topTokens = await getTopTokens();
    console.log('Top Tokens:', topTokens);

    // Example: Fetch the top two tokens for arbitrage execution
    const tokenA = topTokens[0];
    const tokenB = topTokens[1];

    // Set the amount of tokens to trade (example: 1 token)
    const amountIn = 1;

    // Execute the arbitrage
    await executeArbitrage(tokenA, tokenB, amountIn);
}

// Run the bot every minute or based on your required schedule
setInterval(runArbitrageBot, 60000);  // Every minute

