import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface ScoreEntry {
  player: string;
  floor: number;
  time: number;
}

export class OptimismLeaderboard {
  private static readonly CONTRACT = '0x0000000000000000000000000000000000000000';
  private static readonly CHAIN_ID = 10; // Optimism mainnet
  private static readonly ABI = [
    'function submitScore(uint256 floor, uint256 timeMs) external'
  ];

  static async submitScore(floor: number, timeMs: number): Promise<string | null> {
    if (!window.ethereum) {
      return null;
    }

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Check if we're on the correct chain, switch if needed
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== OptimismLeaderboard.CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${OptimismLeaderboard.CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${OptimismLeaderboard.CHAIN_ID.toString(16)}`,
                  chainName: 'Optimism',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://mainnet.optimism.io'],
                  blockExplorerUrls: ['https://optimistic.etherscan.io'],
                },
              ],
            });
          } else {
            return null;
          }
        }

        // Re-check network after switch
        const newNetwork = await provider.getNetwork();
        if (Number(newNetwork.chainId) !== OptimismLeaderboard.CHAIN_ID) {
          return null;
        }
      }

      // Create contract instance
      const contract = new ethers.Contract(
        OptimismLeaderboard.CONTRACT,
        OptimismLeaderboard.ABI,
        signer
      );

      // Submit score
      const tx = await contract.submitScore(floor, timeMs);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      return receipt?.hash || null;
    } catch (error) {
      // Silent failure - game continues
      return null;
    }
  }

  static async getTopScores(): Promise<ScoreEntry[]> {
    // TODO: implement after contract deployment
    // For now, return empty array
    return [];
  }
}
