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
            messageParagraph.textContent = "Error fetching wallet contents.";
        }
    };

    const handleWalletConnect = async (walletName) => {
        if (connectedWallet) {
            messageParagraph.textContent = `Already connected with ${connectedWallet} wallet. Please disconnect first.`;
            return;
        }

        if (walletName === 'Phantom') {
            if (window.solana && window.solana.isPhantom) {
                try {
                    const response = await window.solana.connect();
                    if (response.publicKey) {
                        connectedWallet = 'Phantom';
                        messageParagraph.textContent = "Yay you logged in with Phantom Wallet!";
                        disconnectButton.style.display = 'block';
                        phantomButton.style.display = 'none';
                        solflareButton.style.display = 'none';
                        displayWalletContents(response.publicKey);
                    }
                } catch (error) {
                    console.error('Error connecting to Phantom Wallet:', error);
                    messageParagraph.textContent = "Failed to connect Phantom Wallet.";
                }
            } else {
                messageParagraph.textContent = "Phantom Wallet not found. Please install it.";
            }
        } else if (walletName === 'Solflare') {
            if (window.solflare) {
                try {
                    const response = await window.solflare.connect();
                    if (response.publicKey) {
                        connectedWallet = 'Solflare';
                        messageParagraph.textContent = "Yay you logged in with Solflare Wallet!";
                        disconnectButton.style.display = 'block';
                        phantomButton.style.display = 'none';
                        solflareButton.style.display = 'none';
                        displayWalletContents(response.publicKey);
                    }
                } catch (error) {
                    console.error('Error connecting to Solflare Wallet:', error);
                    messageParagraph.textContent = "Failed to connect Solflare Wallet.";
                }
            } else {
                messageParagraph.textContent = "Solflare Wallet not found. Please install it.";
            }
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
