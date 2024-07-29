document.addEventListener('DOMContentLoaded', async () => {
    const phantomButton = document.getElementById('connect-phantom');
    const solflareButton = document.getElementById('connect-solflare');
    const disconnectButton = document.getElementById('disconnect');
    const messageParagraph = document.getElementById('message');
    const walletInfoDiv = document.getElementById('wallet-info');
    const walletContentsParagraph = document.getElementById('wallet-contents');

    let connectedWallet = null;
    let connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed');
    const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPvW5hWmPqtN98kF3e8e');
    console.log("connection/token program id: ", connection, TOKEN_PROGRAM_ID);

    // Ensure SPL Token library is available
    const ensureSplTokenLibrary = () => {
        return new Promise((resolve, reject) => {
            if (window.splToken) {
                resolve(window.splToken);
                return;
            } else {
                reject(new Error('SPL Token library is not loaded.'));
            }
        });
    };

    // Check if the required libraries are available
    const checkLibraries = async () => {
        if (!window.solana || !window.solana.isPhantom) {
            messageParagraph.textContent = "Error: Phantom wallet is not available.";
            console.error("Phantom wallet is not available.");
            return false;
        }

        if (!window.solflare || !window.solflare.isSolflare) {
            messageParagraph.textContent = "Error: Solflare wallet is not available.";
            console.error("Solflare wallet is not available.");
            return false;
        }

        try {
            await ensureSplTokenLibrary();
        } catch (error) {
            messageParagraph.textContent = `Error: ${error.message}`;
            console.error('Error:', error);
            return false;
        }
        return true;
    };

    // Function to display the contents of the wallet
    const displayWalletContents = async (publicKeyStr) => {
        let publicKey;
        try {
            // Validate the public key string format
            if (typeof publicKeyStr !== 'string' || publicKeyStr.length !== 44) {
                throw new Error('Public key must be a 44-character base58 string.');
            }

            publicKey = new solanaWeb3.PublicKey(publicKeyStr);
            console.log('Public Key:', publicKey.toBase58());
        } catch (error) {
            console.error('Invalid Public Key:', error);
            messageParagraph.textContent = `Error: Invalid Public Key - ${error.message}`;
            return;
        }

        try {
            const splToken = window.splToken;
            const tokenAccounts = await splToken.getParsedTokenAccountsByOwner(
                connection,
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

                    if (account.account.data.parsed && account.account.data.parsed.info.tokenAmount) {
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
        }

        messageParagraph.textContent = `Connecting ${walletName}...`;

        try {
            let response;
            if (walletName === 'Phantom') {
                if (window.solana && window.solana.isPhantom) {
                    response = await window.solana.connect();
                    console.log('Phantom Connect Response:', response);
                } else {
                    messageParagraph.textContent = 'Phantom wallet not detected.';
                    return;
                }
            } else if (walletName === 'Solflare') {
                if (window.solflare && window.solflare.isSolflare) {
                    response = await window.solflare.connect();
                    console.log('Solflare Connect Response:', response);
                } else {
                    messageParagraph.textContent = 'Solflare wallet not detected.';
                    return;
                }
            } else {
                throw new Error(`Unsupported wallet: ${walletName}`);
            }

            if (response.publicKey) {
                messageParagraph.textContent = `Public Key: ${response.publicKey.toBase58()}`;
                connectedWallet = walletName;
                messageParagraph.textContent = `Connected with ${walletName} Wallet!`;
                disconnectButton.style.display = 'block';
                phantomButton.style.display = 'none';
                solflareButton.style.display = 'none';
                displayWalletContents(response.publicKey.toBase58());
            } else {
                messageParagraph.textContent = 'No public key returned.';
            }
        } catch (error) {
            messageParagraph.textContent = `Error connecting ${walletName}: ${error.message}`;
            console.error(`Error connecting ${walletName}:`, error);
        }
    };

    // Initialize and check libraries
    (async () => {
        const librariesAvailable = await checkLibraries();
        if (librariesAvailable) {
            phantomButton.addEventListener('click', () => handleWalletConnect('Phantom'));
            solflareButton.addEventListener('click', () => handleWalletConnect('Solflare'));
            disconnectButton.addEventListener('click', () => {
                connectedWallet = null;
                phantomButton.style.display = 'block';
                solflareButton.style.display = 'block';
                disconnectButton.style.display = 'none';
                messageParagraph.textContent = "Disconnected.";
                walletInfoDiv.style.display = 'none';
            });
        }
    })();
});
