document.addEventListener('DOMContentLoaded', () => {
    const phantomButton = document.getElementById('connect-phantom');
    const solflareButton = document.getElementById('connect-solflare');
    const disconnectButton = document.getElementById('disconnect');
    const messageParagraph = document.getElementById('message');
    const walletInfoDiv = document.getElementById('wallet-info');
    const walletContentsParagraph = document.getElementById('wallet-contents');

    let connectedWallet = null;

    // Verify that the solanaWeb3 library is loaded
    if (!window.solanaWeb3) {
        messageParagraph.textContent = "Error: solanaWeb3 is not available. Please ensure the @solana/web3.js library is correctly loaded.";
        console.error("solanaWeb3 is not available.");
        return;
    }

    // Function to display the contents of the wallet
    const displayWalletContents = async (publicKey) => {
        try {
            // Access the solanaWeb3 object from the window
            const solanaWeb3 = window.solanaWeb3;

            // Create a connection to the Solana blockchain
            const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'));

            // Fetch token accounts for the provided public key
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                publicKey,
                { programId: solanaWeb3.TOKEN_PROGRAM_ID }
            );

            // Check if token accounts were returned and handle unexpected data
            if (!tokenAccounts || !tokenAccounts.value) {
                throw new Error("Unexpected response format from getParsedTokenAccountsByOwner.");
            }

            // Clear previous wallet contents
            walletContentsParagraph.innerHTML = '';
            let hasLargeBalance = false;

            // Check each token account for a balance greater than 100,000
            tokenAccounts.value.forEach((account) => {
                try {
                    // Ensure account data exists and is in the expected format
                    if (account && account.account && account.account.data && account.account.data.parsed) {
                        const balance = account.account.data.parsed.info.tokenAmount.uiAmount;
                        if (balance > 100000) {
                            hasLargeBalance = true;
                            walletContentsParagraph.innerHTML += `Token Account: ${account.pubkey.toBase58()} - Balance: ${balance}<br>`;
                        }
                    } else {
                        console.warn("Unexpected account data format:", account);
                    }
                } catch (accountError) {
                    console.error("Error processing token account:", accountError);
                }
            });

            // Inform the user if no large balance was found
            if (!hasLargeBalance) {
                walletContentsParagraph.textContent = 'No token accounts with more than 100,000 tokens.';
            }

            // Show wallet information
            walletInfoDiv.style.display = 'block';
        } catch (error) {
            // Handle and log any errors encountered while fetching wallet contents
            console.error('Error fetching wallet contents:', error);
            messageParagraph.textContent = `Error fetching wallet contents: ${error.message}`;
        }
    };

    // Function to handle wallet connection
    const handleWalletConnect = async (walletName) => {
        if (connectedWallet) {
            // Inform the user if already connected with a wallet
            messageParagraph.textContent = `Already connected with ${connectedWallet} wallet. Please disconnect first.`;
            return;
        }

        try {
            if (walletName === 'Phantom') {
                // Check for Phantom wallet
                if (window.solana && window.solana.isPhantom) {
                    // Attempt to connect to Phantom wallet
                      try {
                    const response = await window.solflare.connect();
                          console.log("response: ", response)
                   } catch (err){
                       console.log("err: ", err)
                        messageParagraph.textContent = "Phantom Wallet failed";
}
                    if (response.publicKey) {
                        connectedWallet = 'Phantom';
                        messageParagraph.textContent = "Connected with Phantom Wallet!";
                        disconnectButton.style.display = 'block';
                        phantomButton.style.display = 'none';
                        solflareButton.style.display = 'none';
                        displayWalletContents(response.publicKey);
                    }
                } else {
                    messageParagraph.textContent = "Phantom Wallet not found. Please install it.";
                }
            } else if (walletName === 'Solflare') {
                 messageParagraph.textContent = "Solflare Wallet connecting...";
                // Check for Solflare wallet
                if (window.solflare) {
                    // Attempt to connect to Solflare wallet
                   try {
                    const response = await window.solflare.connect();
                         console.log("response: ", response)
                   } catch (err){
                       console.log("err: ", err)
                        messageParagraph.textContent = "Solflare Wallet failed";
}
                    if (response.publicKey) {
                        connectedWallet = 'Solflare';
                        messageParagraph.textContent = "Connected with Solflare Wallet!";
                        disconnectButton.style.display = 'block';
                        phantomButton.style.display = 'none';
                        solflareButton.style.display = 'none';
                        displayWalletContents(response.publicKey);
                    }
                } else {
                    messageParagraph.textContent = "Solflare Wallet not found. Please install it.";
                }
            }
        } catch (error) {
            // Handle and log any errors encountered while connecting to the wallet
            console.error(`Error connecting to ${walletName} Wallet:`, error);
            messageParagraph.textContent = `Failed to connect ${walletName} Wallet: ${error.message}`;
        }
    };

    // Function to handle wallet disconnection
    const handleDisconnect = () => {
        if (connectedWallet) {
            connectedWallet = null;
            messageParagraph.textContent = "Wallet disconnected.";
            walletInfoDiv.style.display = 'none';
            walletContentsParagraph.textContent = '';
            disconnectButton.style.display = 'none';
            phantomButton.style.display = 'block';
            solflareButton.style.display = 'block';
        }
    };

    // Attach event listeners to buttons
    phantomButton.addEventListener('click', () => handleWalletConnect('Phantom'));
    solflareButton.addEventListener('click', () => handleWalletConnect('Solflare'));
    disconnectButton.addEventListener('click', handleDisconnect);
});
