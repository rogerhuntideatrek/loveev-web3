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

            // Manually initialize TOKEN_PROGRAM_ID if it's undefined
            let TOKEN_PROGRAM_ID;
            try {
                TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXC1h9n1t6iWbCzUQu7k');
                console.log('TOKEN_PROGRAM_ID RAW:', TOKEN_PROGRAM_ID);
                console.log('TOKEN_PROGRAM_ID:', TOKEN_PROGRAM_ID.toBase58());
            } catch (error) {
                console.error('Error initializing TOKEN_PROGRAM_ID:', error);
                messageParagraph.textContent = `Error initializing TOKEN_PROGRAM_ID: ${error.message}`;
                return;
            }

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
                    
