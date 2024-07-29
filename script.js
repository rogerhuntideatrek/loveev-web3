document.addEventListener('DOMContentLoaded', () => {
    const phantomButton = document.getElementById('connect-phantom');
    const solflareButton = document.getElementById('connect-solflare');
    const disconnectButton = document.getElementById('disconnect');
    const messageParagraph = document.getElementById('message');
    const walletInfoDiv = document.getElementById('wallet-info');
    const walletContentsParagraph = document.getElementById('wallet-contents');

    let connectedWallet = null;

    // Check if the required libraries are available
    if (!window.solana || !window.solana.isPhantom || !window.solflare || !window.solflare.isSolflare) {
        messageParagraph.textContent = `Error: Required libraries or wallets are not available.`;
        if (!window.solana){
           messageParagraph.textContent += `\nsolana is not available`
        }
        if (!window.solana.isPhantom){
           messageParagraph.textContent += `\nphantom is not available`
        }
        if (!window.solflare){
           messageParagraph.textContent += `\nsolflare is not available`
        }
        if (!window.solflare.isSolflare){
           messageParagraph.textContent += `\nisSolflare is not available`
        }
        console.error("Required libraries or wallets are not available.");
        return;
    }

    const { Connection, PublicKey, clusterApiUrl } = window.solanaWeb3;
    const { TOKEN_PROGRAM_ID } = window.splToken;

    if (!TOKEN_PROGRAM_ID) {
        messageParagraph.textContent += `\nTOKEN_PROGRAM_ID is not available.`;
        console.error("TOKEN_PROGRAM_ID is not available.");
    }

    const connection = new Connection(clusterApiUrl('mainnet-beta'));

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

    // Add event listeners
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
});
