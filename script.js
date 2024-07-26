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

            // Clear previous wallet contents
            walletContentsParagraph.innerHTML = '';
            let hasLargeBalance = false;

            // Check each token account for a balance greater than 100,000
            tokenAccounts.value.forEach((account) => {
                const balance = account.account.data.parsed.info.tokenAmount.uiAmount;
                if (balance > 100000) {
                    hasLargeBalance = true;
                    walletContentsParagraph.innerHTML += `Token Account: ${account.pubkey.toBase58()} - Balance: ${balance}<br>`;
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
                    const response = await window.solana.connect();
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
                // Check for Solflare wallet
                if (window.solflare) {
                    // Attempt to connect to Solflare wallet
                    const response = await window.solflare.connect();
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
