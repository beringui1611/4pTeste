require('dotenv').config();
import {Token, ChainId, } from '@uniswap/sdk-core';
import { computePoolAddress, FeeAmount } from '@uniswap/v3-sdk';
import abi from './abi.json';
import QuoterABI from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json';
import TokenABI from './tokenErc20.json';
import SwapABI from './swap.json';
import {ethers} from 'ethers';
import e, { json } from 'express';


const {INTERVAL, FACTORY_ADDRESS, QUOTER_ADDRESS, TOKEN_USDT_ADDRESS, TOKEN_WETH_ADDRESS, TOKEN_GRT_ADDRESS, PORT, PRIVATE_KEY, ROUTER_ADDRESS}:any = process.env;

const USDT_TOKEN = new Token(ChainId.ARBITRUM_ONE, TOKEN_USDT_ADDRESS, 6, "USDT", "Tether USD");
const WETH_TOKEN = new Token(ChainId.ARBITRUM_ONE, TOKEN_WETH_ADDRESS, 18, "ETH", "Wreapped Ether");
const GRT_TOKEN = new Token(ChainId.ARBITRUM_ONE, TOKEN_GRT_ADDRESS, 18, "GRT", "Graph Token");
const SWAP_CONTRACT = "0x787657f09f808D9Bc1FF68B07F0f64EBcD22957f";
const provider = new ethers.JsonRpcProvider(`https://arbitrum-mainnet.infura.io/v3/8c33f0f92f644e42a593232b8caa2608`);

const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const tokenContract:any = new ethers.Contract(USDT_TOKEN.address, TokenABI as ethers.InterfaceAbi, provider);
const swapContract:any = new ethers.Contract(SWAP_CONTRACT, SwapABI.abi as ethers.InterfaceAbi, provider);

async function approve(amount:any){
    const tx = await tokenContract.connect(signer).approve(SWAP_CONTRACT, amount);
    console.log("approving at" + tx.hash);
    await tx.wait();
}

function getTokenOrder(tokenIn:any, tokenOut:any){
    if(ethers.toBigInt(tokenIn) <= ethers.toBigInt(tokenOut)){
        return {token0: tokenIn, token1: tokenOut}
    }else {
        return {token0: tokenOut, token1: tokenIn}
    }
}

async function preparationCycle(){
    const currentPoolAddress = computePoolAddress({
        factoryAddress: FACTORY_ADDRESS,
        tokenA: USDT_TOKEN,
        tokenB: WETH_TOKEN,
        fee: FeeAmount.MEDIUM 
    })

    const poolContract = new ethers.Contract(currentPoolAddress, new ethers.Interface(abi.abi), provider);
    console.log(`pool address ${currentPoolAddress}`);
    
    const result:any = getTokenOrder(TOKEN_USDT_ADDRESS, TOKEN_WETH_ADDRESS);
    result.fee = await poolContract.fee();
    console.log(result);
    return result;
}

async function executionCycle(token0:any, token1:any, fee:any) {
   const quoterContract = new ethers.Contract(QUOTER_ADDRESS, QuoterABI.abi, provider);
   const quotedAmountOut = await quoterContract.quoteExactInputSingle.staticCall(
        token0, 
        token1, 
        fee, 
        ethers.parseEther("1"), 
        0);
    
        console.log(`exactOutPut to equal ${ethers.formatUnits(quotedAmountOut, 6)}`)

        return ethers.formatUnits(quotedAmountOut, 6);
}

async function swap(tokenIn:any, tokenOut:any, amountIn:any, router:any){
    await approve(amountIn);

    const amountOut = await swapContract.connect(signer).swap(
        tokenIn, 
        tokenOut, 
        amountIn, 
        router
    );

    return amountOut;
}

const app = e();

app.use(json());


app.get("/exact", async (req, res) => {

    const {token0, token1, fee} = await preparationCycle();
    const result = await executionCycle(token0, token1, fee);

    await res.json({exactOutPut: result})
})

app.post("/swap", async (req, res) => {
    try {
        const amountIn = 100000;

        const result = await swap(USDT_TOKEN.address, WETH_TOKEN.address, amountIn, "0xE592427A0AEce92De3Edee1F18E0157C05861564");

        res.json({ success: true, result });
    } catch (error) {
        console.error("Error in swap:", error);
        res.status(500).json({ success: false, message: "Error during swap" });
    }
});


app.listen(PORT, () => {
    console.log("Server On! 🚀🚀")
})