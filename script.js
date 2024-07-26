document.addEventListener('DOMContentLoaded', () => {
    const phantomButton = document.getElementById('connect-phantom');
    const solflareButton = document.getElementById('connect-solflare');
    const messageParagraph = document.getElementById('message');

    const { solana } = window;

    const handleWalletConnect = async (walletName) => {
        if (walletName === 'Phantom') {
            if (solana && solana.isPhantom) {
                try {
                    const response = await solana.connect();
                    if (response.publicKey) {
                        messageParagraph.textContent = "Yay you logged in with Phantom Wallet!";
                    }
                } catch (error) {
                    console.error('Error connecting to Phantom Wallet:', error);
                    messageParagraph.textContent = "Failed to connect Phantom Wallet.";
                }
            } else {
                messageParagraph.textContent = "Phantom Wallet not found. Please install it.";
            }
        } else if (walletName === 'Solflare') {
            try {
                const solflare = window.solflare;
                if (solflare) {
                    const response = await solflare.connect();
                    if (response.publicKey) {
                        messageParagraph.textContent = "Yay you logged in with Solflare Wallet!";
                    }
                } else {
                    messageParagraph.textContent = "Solflare Wallet not found. Please install it.";
                }
            } catch (error) {
                console.error('Error connecting to Solflare Wallet:', error);
                messageParagraph.textContent = "Failed to connect Solflare Wallet.";
            }
        }
    };

    phantomButton.addEventListener('click', () => handleWalletConnect('Phantom'));
    solflareButton.addEventListener('click', () => handleWalletConnect('Solflare'));
});
