document.addEventListener('DOMContentLoaded', async () => {
    const phantomButton = document.getElementById('connect-phantom');
    const solflareButton = document.getElementById('connect-solflare');
    const disconnectButton = document.getElementById('disconnect');
    const messageParagraph = document.getElementById('message');
    const walletInfoDiv = document.getElementById('wallet-info');
    const walletContentsParagraph = document.getElementById('wallet-contents');

    let connectedWallet = null;

    // Function to dynamically load the SPL Token library
    const loadSplTokenLibrary = () => {
        return new Promise((resolve, reject) => {
            if (window.splToken) {
                // SPL Token library already loaded
                resolve(window.splToken);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@solana/spl-token@latest/dist/index.min.js';
            script.onload = () => {
                // Check if the library is correctly attached to window.splToken
                if (window.splToken) {
                    resolve(window.splToken);
                } else {
                    reject(new Error('SPL Token library loaded but window.splToken is undefined'));
                }
            };
            script.onerror = () => reject(new Error('Failed to load SPL Token library'));
            document.head.appendChild(script);
        });
    };

    // Check if the required libraries are available
    const checkLibraries = async () => {
        // Check for Phantom wallet
        if (!window.solana || !window.solana.isPhantom) {
            messageParagraph.textContent = "Error: Phantom wallet is not available.";
            console.error("Phantom wallet is not available.");
            return false;
        }

        // Check for Solflare wallet
        if (!window.solflare || !window.solflare.isSolflare) {
            messageParagraph.textContent = "Error: Solflare wallet is not available.";
            console.error("Solflare wallet is not available.");
            return false;
        }

        try {
            // Check and load SPL Token library if it's not available
            if (!window.splToken) {
                await loadSplTokenLibrary();
            }

            if (!window.splToken || !window.splToken.TOKEN_PROGRAM_ID) {
                messageParagraph.textContent = "Error: SPL Token library is not available.";
                console.error("SPL Token library is not available or TOKEN_PROGRAM_ID is undefined.");
                return false;
            }
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
            // Add event listeners if libraries are available
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
