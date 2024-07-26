document.addEventListener('DOMContentLoaded', () => {
    const connectButton = document.getElementById('connect-wallet');
    const messageParagraph = document.getElementById('message');

    // Create a connection to the Solana blockchain
    const { solana } = window;

    connectButton.addEventListener('click', async () => {
        if (solana && solana.isPhantom) {
            try {
                // Request connection to Phantom Wallet
                const response = await solana.connect();
                
                // Check if wallet is connected
                if (response.publicKey) {
                    // Display success message
                    messageParagraph.textContent = "Yay you logged in!";
                }
            } catch (error) {
                console.error('Error connecting to Phantom Wallet:', error);
                messageParagraph.textContent = "Failed to connect wallet.";
            }
        } else {
            messageParagraph.textContent = "Phantom Wallet not found. Please install it.";
        }
    });
});
