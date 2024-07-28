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
    } else {
        messageParagraph.textContent = "SolanaWeb3 is Available";
        console.info("solanaWeb3 IS available.");
    }

    // Function to display the contents of the wallet
    const displayWalletContents = async (publicKey) => {
        console.log("PublicKey in displayWalletContents:", publicKey);
        const solanaWeb3 = window.solanaWeb3;
        const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'));

        try {
            const key = new solanaWeb3.PublicKey(publicKey);
            console.log('Public Key:', key.toBase58());

            const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXC1h9n1t6iWbCzUQu7k');

             console.log('TOKEN_PROGRAM_ID RAW:', TOKEN_PROGRAM_ID);
            console.log('TOKEN_PROGRAM_ID:', TOKEN_PROGRAM_ID.toBase58());

            try {
                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                    key,
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
        } catch (keyError) {
            console.error('Invalid Public Key:', keyError);
            messageParagraph.textContent = `Invalid Public Key: ${keyError.message}`;
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
                        const response = await window.phantom.solana.connect();
                        console.log('Phantom Connect Response:', response);

                        if (response.publicKey) {
                            messageParagraph.textContent = `Public Key: ${response.publicKey}`;
                            connectedWallet = 'Phantom';
                            messageParagraph.textContent = "Connected with Phantom Wallet!";
                            disconnectButton.style.display = 'block';
                            phantomButton.style.display = 'none';
                            solflareButton.style.display = 'none';
                            displayWalletContents(response.publicKey);
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
                            messageParagraph.textContent = `Public Key: ${response.publicKey}`;
                            connectedWallet = 'Solflare';
                            messageParagraph.textContent = "Connected with Solflare Wallet!";
                            disconnectButton.style.display = 'block';
                            phantomButton.style.display = 'none';
                            solflareButton.style.display = 'none';
                            displayWalletContents(response.publicKey);
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
                messageParagraph.textContent = "Unknown wallet type.";
                console.error(`Unknown wallet type: ${walletName}`);
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
        } else {
            messageParagraph.textContent = "No wallet is currently connected.";
        }
    };

    // Attach event listeners to buttons
    phantomButton.addEventListener('click', () => handleWalletConnect('Phantom'));
    solflareButton.addEventListener('click', () => handleWalletConnect('Solflare'));
    disconnectButton.addEventListener('click', handleDisconnect);
});
