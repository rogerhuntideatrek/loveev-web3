document.addEventListener('DOMContentLoaded', () => {
    const phantomButton = document.getElementById('connect-phantom');
    const solflareButton = document.getElementById('connect-solflare');
    const disconnectButton = document.getElementById('disconnect');
    const messageParagraph = document.getElementById('message');
    const walletInfoDiv = document.getElementById('wallet-info');
    const walletContentsParagraph = document.getElementById('wallet-contents');

    let connectedWallet = null;

    // Ensure solanaWeb3 and splToken are available
    if (!window.solanaWeb3 || !window.splToken) {
        messageParagraph.textContent = "Error: Required libraries are not available.";
        console.error("Required libraries are not available.");
        return;
    }

    const { Connection, PublicKey, clusterApiUrl } = window.solanaWeb3;
    const { TOKEN_PROGRAM_ID } = window.splToken;

    // Function to display the contents of the wallet
    const displayWalletContents = async (publicKeyStr) => {
        const connection = new Connection(clusterApiUrl('mainnet-beta'));

        let publicKey;
        try {
            publicKey = new PublicKey(publicKeyStr);
            console.log('Public Key:', publicKey.toBase58());
        } catch (error) {
            console.error('Invalid Public Key:', error);
            messageParagraph.textContent = `Error: Invalid Public Key - ${error.message}`;
            return;
        }

        try {
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                publicKey,
                { programId: TOKEN_PROGRAM_ID }
            );

            console.log("Raw Token Accounts Response:", tokenAccounts);

            if (!tokenAccounts || !tokenAccounts.value) {
                throw new Error('Unexpected response format from getParsedTokenAccountsByOwner.');
            }

            walletContentsParagraph.innerHTML = '';
            let hasLargeBalance = false;

            tokenAccounts.value.forEach((account) => {
                try {
                    console.log('Token Account:', account);

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
                    walletContentsParagraph.innerHTML += `Error processing token account: ${accountError.message}<br>`;
                }
            });

            if (!hasLargeBalance) {
                walletContentsParagraph.textContent = 'No token accounts with more than 100,000 tokens.';
            }

            walletInfoDiv.style.display = 'block';
        } catch (fetchError) {
            console.error('Error fetching token accounts:', fetchError);
            messageParagraph.textContent = `Error fetching token accounts: ${fetchError.message}`;
        }
    };

    // Function to handle wallet connection
    const handleWalletConnect = async (walletName) => {
        if (connectedWallet) {
            messageParagraph.textContent = `Already connected with ${connectedWallet} wallet. Please disconnect first.`;
            return;
        } else {
            messageParagraph.textContent = `Connecting ${walletName}...`;
        }

        try {
            if (walletName === 'Phantom') {
                if (window.solana && window.solana.isPhantom) {
                    try {
                        const response = await window.solana.connect();
                        console.log('Phantom Connect Response:', response);

                        if (response.publicKey) {
                            messageParagraph.textContent = `Public Key: ${response.publicKey.toBase58()}`;
                            connectedWallet = 'Phantom';
                            messageParagraph.textContent = "Connected with Phantom Wallet!";
                            disconnectButton.style.display = 'block';
                            phantomButton.style.display = 'none';
                            solflareButton.style.display = 'none';
                            displayWalletContents(response.publicKey.toBase58());
                        } else {
                            messageParagraph.textContent = 'No Public Key received from Phantom.';
                        }
                    } catch (connectError) {
                        messageParagraph.textContent = "Phantom Wallet failed to connect.";
                        console.error("Phantom Wallet connection error:", connectError);
                    }
                } else {
                    messageParagraph.textContent = "Phantom Wallet not found. Please install it.";
                }
            } else if (walletName === 'Solflare') {
                if (window.solflare) {
                    try {
                        const response = await window.solflare.connect();
                        console.log('Solflare Connect Response:', response);

                        if (response.publicKey) {
                            messageParagraph.textContent = `Public Key: ${response.publicKey.toBase58()}`;
                            connectedWallet = 'Solflare';
                            messageParagraph.textContent = "Connected with Solflare Wallet!";
                            disconnectButton.style.display = 'block';
                            phantomButton.style.display = 'none';
                            solflareButton.style.display = 'none';
                            displayWalletContents(response.publicKey.toBase58());
                        } else {
                            messageParagraph.textContent = 'No Public Key received from Solflare.';
                        }
                    } catch (connectError) {
                        messageParagraph.textContent = "Solflare Wallet failed to connect.";
                        console.error("Solflare Wallet connection error:", connectError);
                    }
                } else {
                    messageParagraph.textContent = "Solflare Wallet not found. Please install it.";
                }
            } else {
                messageParagraph.textContent = "Unsupported wallet type.";
            }
        } catch (error) {
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
