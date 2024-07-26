document.addEventListener('DOMContentLoaded', () => {
    const phantomButton = document.getElementById('connect-phantom');
    const solflareButton = document.getElementById('connect-solflare');
    const disconnectButton = document.getElementById('disconnect');
    const messageParagraph = document.getElementById('message');
    const walletInfoDiv = document.getElementById('wallet-info');
    const walletContentsParagraph = document.getElementById('wallet-contents');

    let connectedWallet = null;

    const displayWalletContents = async (publicKey) => {
        try {
            if (!window.solanaWeb3) {
                throw new Error('solanaWeb3 is not available.');
            }
            
            const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'));

            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                publicKey,
                { programId: solanaWeb3.TOKEN_PROGRAM_ID }
            );

            walletContentsParagraph.innerHTML = '';
            let hasLargeBalance = false;
            tokenAccounts.value.forEach((account) => {
                const balance = account.account.data.parsed.info.tokenAmount.uiAmount;
                if (balance > 100000) {
                    hasLargeBalance = true;
                    walletContentsParagraph.innerHTML += `Token Account: ${account.pubkey.toBase58()} - Balance: ${balance}<br>`;
                }
            });

            if (!hasLargeBalance) {
                walletContentsParagraph.textContent = 'No token accounts with more than 100,000 tokens.';
            }

            walletInfoDiv.style.display = 'block';
        } catch (error) {
            console.error('Error fetching wallet contents:', error);
            messageParagraph.textContent = "Error fetching wallet contents: " + error.message;
        }
    };

    const handleWalletConnect = async (walletName) => {
        console.log(window.solanaWeb3);
        if (connectedWallet) {
            messageParagraph.textContent = `Already connected with ${connectedWallet} wallet. Please disconnect first.`;
            return;
        }

        try {
            if (walletName === 'Phantom') {
                if (window.solana && window.solana.isPhantom) {
                    const response = await window.solana.connect();
                    if (response.publicKey) {
                        connectedWallet = 'Phantom';
                        messageParagraph.textContent = "Yay you logged in with Phantom Wallet!";
                        disconnectButton.style.display = 'block';
                        phantomButton.style.display = 'none';
                        solflareButton.style.display = 'none';
                        displayWalletContents(response.publicKey);
                    }
                } else {
                    messageParagraph.textContent = "Phantom Wallet not found. Please install it.";
                }
            } else if (walletName === 'Solflare') {
                if (window.solflare) {
                    const response = await window.solflare.connect();
                    if (response.publicKey) {
                        connectedWallet = 'Solflare';
                        messageParagraph.textContent = "Yay you logged in with Solflare Wallet!";
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
            console.error(`Error connecting to ${walletName} Wallet:`, error);
            messageParagraph.textContent = `Failed to connect ${walletName} Wallet: ${error.message}`;
        }
    };

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

    phantomButton.addEventListener('click', () => handleWalletConnect('Phantom'));
    solflareButton.addEventListener('click', () => handleWalletConnect('Solflare'));
    disconnectButton.addEventListener('click', handleDisconnect);
});
