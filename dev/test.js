const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();

const bc1 = {
    chain: [
        {
            index: 1,
            timestamp: 1633081311794,
            transactions: [],
            nonce: 100,
            hash: '0',
            previousHash: '0',
        },
        {
            index: 2,
            timestamp: 1633081465644,
            transactions: [
                {
                    amount: 1269,
                    sender: '9000nDHGHIJBFDYTDUBL89CBJ',
                    recipient: '6sHJOUOUJRSTR6897IUFGHCGC',
                    transactionId: 'f23c677647574476a5e85e54e1af22d2',
                },
                {
                    amount: 69,
                    sender: '769nDHGHIJBFDYTDUBL89CBJ',
                    recipient: '6sHJOUOUJRSTR6897IUFGHCGC',
                    transactionId: '6bc5451e301b4e64aad8220629dc685a',
                },
            ],
            nonce: 103569,
            hash: '000022c9dd21f31d7066e8ceb83cb339abae6aef80a8c7c13f54b49384106f33',
            previousHash: '0',
        },
        {
            index: 3,
            timestamp: 1633081556129,
            transactions: [
                {
                    amount: 12.5,
                    sender: '00',
                    recipient: 'c398d84e935e4555ae0acf1e0a7fcdcd',
                    transactionId: '92331da20bf741509c6cd1315f640f0c',
                },
                {
                    amount: 9,
                    sender: '769nDHGHIJBFDYTD9CBJ',
                    recipient: '6sHJOUOUJRSTR6897IUFGHCGC',
                    transactionId: 'd612c642555443bcb827404474aa581b',
                },
            ],
            nonce: 2020,
            hash: '00008fa6680520e778c64ba2aa6d02806b67809d490d4f446a578f2d677ee992',
            previousHash:
                '000022c9dd21f31d7066e8ceb83cb339abae6aef80a8c7c13f54b49384106f33',
        },
    ],
    pendingTransactions: [
        {
            amount: 12.5,
            sender: '00',
            recipient: 'c398d84e935e4555ae0acf1e0a7fcdcd',
            transactionId: '2ad79fff8e4344c7ae8e8bf439276881',
        },
    ],
    currentNodeURL: 'http://localhost:3001',
    networkNodes: [
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3004',
        'http://localhost:3005',
    ],
};

console.log(bitcoin.chainIsValid(bc1.chain));
