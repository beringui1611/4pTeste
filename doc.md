# Uniswap Swap Simulation and Execution

## Overview
This project demonstrates how to interact with the Uniswap V3 protocol to:
1. Query and simulate token prices using a liquidity pool.
2. Construct and execute swaps using the `exactOutput` function.

### Technologies Used:
- JavaScript with TypeScript typings
- Ethers.js for Ethereum blockchain interactions
- Express.js for API server
- Uniswap SDK-Core and SDK-V3
- dotenv for environment variable management

---

## Installation and Setup

### Prerequisites:
1. Node.js and npm/yarn installed.
2. Infura API key for Arbitrum Mainnet.
3. Uniswap V3 contract ABIs.
4. Wallet private key with sufficient funds on Arbitrum Mainnet.

### Installation Steps:
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and set the following variables:
   ```env
   INTERVAL=YOUR_INTERVAL
   FACTORY_ADDRESS=0x... (Uniswap V3 Factory address)
   QUOTER_ADDRESS=0x... (Uniswap V3 Quoter address)
   TOKEN_USDT_ADDRESS=0x... (USDT token address on Arbitrum)
   TOKEN_WETH_ADDRESS=0x... (WETH token address on Arbitrum)
   TOKEN_GRT_ADDRESS=0x... (GRT token address on Arbitrum)
   PORT=3000
   PRIVATE_KEY=your-wallet-private-key
   ROUTER_ADDRESS=0x... (Uniswap V3 Router address)
   ```

---

## Smart Contract: `SwapTeste4p`

### Contract Functionality
This contract facilitates token swaps using Uniswap V3's `exactInputSingle` function.

### Function: `swap`
The `swap` function allows a user to exchange tokens via the Uniswap router.

#### Parameters:
- `address tokenIn`: The address of the token being swapped from.
- `address tokenOut`: The address of the token being swapped to.
- `uint256 amountIn`: The amount of `tokenIn` to be swapped.
- `address swapRouter`: The address of the Uniswap V3 router.

#### Returns:
- `uint256 amountOut`: The amount of `tokenOut` received from the swap.

#### Implementation:
```solidity
function swap(address tokenIn, address tokenOut, uint256 amountIn, address swapRouter) external returns(uint256 amountOut) {
    ISwapRouter router = ISwapRouter(swapRouter);

    TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);

    TransferHelper.safeApprove(tokenIn, address(router), amountIn);

    ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        fee: 3000,
        recipient: msg.sender,
        deadline: block.timestamp,
        amountIn: amountIn,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0
    });

    amountOut = router.exactInputSingle(params);
    require(amountOut != 0, "Swap failed or returned zero");
}
```

#### Key Components:
1. **Approval and Transfer:**
   - Tokens are transferred to the contract and approved for the router to access them.
   ```solidity
   TransferHelper.safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);
   TransferHelper.safeApprove(tokenIn, address(router), amountIn);
   ```

2. **Router Interaction:**
   - Constructs `ExactInputSingleParams` and executes the swap using `exactInputSingle`.
   ```solidity
   ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
       tokenIn: tokenIn,
       tokenOut: tokenOut,
       fee: 3000,
       recipient: msg.sender,
       deadline: block.timestamp,
       amountIn: amountIn,
       amountOutMinimum: 0,
       sqrtPriceLimitX96: 0
   });
   amountOut = router.exactInputSingle(params);
   ```

3. **Error Handling:**
   - Ensures the swap does not return zero output.
   ```solidity
   require(amountOut != 0, "Swap failed or returned zero");
   ```

---

## API Endpoints

### 1. **GET `/exact`**
Simulates the token price using the liquidity pool and returns the exact output.

#### Response:
- **200 OK**:
  ```json
  {
    "exactOutPut": "<amount-out>"
  }
  ```
- **500 Internal Server Error**:
  ```json
  {
    "message": "Error during simulation"
  }
  ```

### 2. **POST `/swap`**
Executes a swap between USDT and WETH tokens.

#### Request Body:
Not required (hardcoded values used for this demonstration).

#### Response:
- **200 OK**:
  ```json
  {
    "success": true,
    "result": "<swap-result>"
  }
  ```
- **500 Internal Server Error**:
  ```json
  {
    "success": false,
    "message": "Error during swap"
  }
  ```

---

## Running the Server
1. Start the server:
   ```bash
   npm run dev
   ```
2. Access the endpoints at:
   - `http://localhost:<PORT>/exact` for simulation.
   - `http://localhost:<PORT>/swap` for execution.

---

## Notes
- Ensure the wallet has sufficient balance of tokens and gas fees.
- Replace all placeholder values in the `.env` file with real addresses and keys.
- This implementation assumes the `swapContract` ABI matches the deployed contract on Arbitrum.
- Always test on a testnet before deploying to the mainnet.

## IMPORTANTE
Ao tentar obter a cotação do par USDT/GRT, enfrentei um erro relacionado ao SPL. Por isso, optei por utilizar o par USDT/ETH. Apesar disso, o swap foi implementado de forma dinâmica, permitindo negociar qualquer token, desde que os endereços sejam passados manualmente, já que o projeto é apenas um modelo de teste.

Na rota de swap, testei com dois pares: USDT/ETH e WETH/GRT. Nesse caso, o GRT funcionou perfeitamente. Preferi realizar os swaps diretamente por um smart contract em Solidity, pois tenho mais familiaridade com essa abordagem. No entanto, também é viável fazer chamadas diretamente na ABI do router utilizando TypeScript.

Se meu PC estiver ligado, você pode testar as rotas usando o ngrok:

/swap: executa o swap com os tokens informados.
/exact: retorna a cotação de USDT/ETH.
O endereço para acesso via ngrok é:
https://7225-177-185-44-25.ngrok-free.app
