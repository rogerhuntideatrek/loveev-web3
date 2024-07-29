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
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@solana/spl-token@latest/dist/index.min.js';
            script.onload = () => resolve(window.splToken);
            script.onerror = () => reject(new Error('Failed to load SPL Token library'));
            document.head.appendChild(script);
        });
    };

    // Check if the required libraries are available
    const checkLibraries = async () => {
        if (!window.solana || !window.solana.isPhantom) {
            messageParagraph.textContent += `\nError: Phantom wallet is not available.`;
            console.error("Phantom wallet is not available.");
            return false;
        }

         // Check for Solflare wallet
        if (!window.solflare || !window.solflare.isSolflare) {
            messageParagraph.textContent += `\nError: Solflare wallet is not available.`;
            console.error("Solflare wallet is not available.");
            return false;
        }

        try {
            if (!window.splToken) {
                // Load SPL Token library if it's not already available
                await loadSplTokenLibrary();
            }

            if (!window.splToken || !window.splToken.TOKEN_PROGRAM_ID) {
                messageParagraph.textContent += `\nError: SPL Token wallet is not available.`;
                console.error("SPL Token library is not available.");
                return false;
            }
        } catch (error) {
            messageParagraph.textContent += `\nError: ${error.message}`;
            console.error('Error:', error);
            return false;
        }
        return true;
    };

    const { Connection, PublicKey, clusterApiUrl } = window.solanaWeb3;
    const { TOKEN_PROGRAM_ID } = window.splToken;

    const connection = new Connection(clusterApiUrl('mainnet-beta'));

    // Function to display the contents of the wallet
    const displayWalletContents = async (publicKeyStr) => {
        let publicKey;
        try {
            publicKey = new PublicKey(publicKeyStr);
            console.log('Public Key:', publicKey.toBase58());
        } catch (error) {
            console.error('Invalid Public Key:', error);
            messageParagraph.textContent += `\nError: Invalid Public Key - ${error.message}`;
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
            messageParagraph.textContent += `\nError fetching token accounts: ${fetchError.message}`;
        }
    };

    // Function to handle wallet connection
    const handleWalletConnect = async (walletName) => {
        if (connectedWallet) {
            messageParagraph.textContent += `\nAlready connected with ${connectedWallet} wallet. Please disconnect first.`;
            return;
        }

        messageParagraph.textContent += `\nConnecting ${walletName}...`;

        try {
            let response;
            if (walletName === 'Phantom') {
                if (window.solana && window.solana.isPhantom) {
                    response = await window.solana.connect();
                    console.log('Phantom Connect Response:', response);
                } else {
                    messageParagraph.textContent += '\nPhantom wallet not detected.';
                    return;
                }
            } else if (walletName === 'Solflare') {
                if (window.solflare && window.solflare.isSolflare) {
                    response = await window.solflare.connect();
                    console.log('Solflare Connect Response:', response);
                } else {
                    messageParagraph.textContent += `\nSolflare wallet not detected.`;
                    return;
                }
            } else {
                throw new Error(`Unsupported wallet: ${walletName}`);
            }

            if (response.publicKey) {
                messageParagraph.textContent += `\nPublic Key: ${response.publicKey.toBase58()}`;
                connectedWallet = walletName;
                messageParagraph.textContent += `\nConnected with ${walletName} Wallet!`;
                disconnectButton.style.display = 'block';
                phantomButton.style.display = 'none';
                solflareButton.style.display = 'none';
                displayWalletContents(response.publicKey.toBase58());
            } else {
                messageParagraph.textContent += `\nNo public key returned.`;
            }
        } catch (error) {
            messageParagraph.textContent += `\nError connecting ${walletName}: ${error.message}`;
            console.error(`Error connecting ${walletName}:`, error);
        }
    };

    // Initialize and check libraries
    (async () => {
        const librariesAvailable = await checkLibraries();
      
            // Add event listeners if libraries are available
            phantomButton.addEventListener('click', () => handleWalletConnect('Phantom'));
            solflareButton.addEventListener('click', () => handleWalletConnect('Solflare'));
            disconnectButton.addEventListener('click', () => {
                connectedWallet = null;
                phantomButton.style.display = 'block';
                solflareButton.style.display = 'block';
                disconnectButton.style.display = 'none';
                messageParagraph.textContent += `\nDisconnected.`;
                walletInfoDiv.style.display = 'none';
            });
  
    })();
});
