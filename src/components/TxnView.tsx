import React, { useEffect, useState } from "react";
import Chart from "react-google-charts";
import { MdContentCopy } from "react-icons/md";

interface TxnViewProps {
    txn: {
        txn_hash: string;
        status: string;
        amount: number;
        type: number;
        nonce: number;
        fee: number;
        senders: Sender[] | null;
        receivers: Receiver[] | null;
    };
    txnTypes: string[];
}

interface Sender {
    amount: number;
    sender_key: string;
}

interface Receiver {
    amount: number;
    receiver_key: string;
}

const TxnView: React.FC<TxnViewProps> = ({ txn, txnTypes }) => {
    const { txn_hash, status, amount, type, nonce, fee, senders, receivers } = txn;
    
    const [data, setData] = useState<(number | string)[][]>([["From", "To", "Amount"]]);

    const optionsDarkTheme = {
        sankey: {
            node: {
                colors: ["#FFA500", "#32CD32"],
                label: {
                    fontName: "Arial",
                    fontSize: 14,
                    color: "#fff",
                },
            },
            link: {
                colorMode: "gradient",
                colors: ["#FFA500", "#32CD32"],
            },
        },
        enableInteractivity: false,
    };
    
    const optionsLightTheme = {
        sankey: {
            node: {
                colors: ["#d6336c", "#f59e0b"], 
                label: {
                    fontName: "Arial",
                    fontSize: 14,
                    color: "#34568B", 
                },
            },
            link: {
                colorMode: "gradient",
                colors: ["#d6336c", "#f59e0b"], 
            },
        },
        enableInteractivity: true, 
    };
    
    const optionsLightThemeBlueVariants = {
    sankey: {
        node: {
            colors: ["#1E90FF", "#00CED1"], 
            label: {
                fontName: "Arial",
                fontSize: 14,
                color: "#000080", 
            },
        },
        link: {
            colorMode: "gradient",
            colors: ["#1E90FF", "#00CED1"], 
        },
    },
    enableInteractivity: true,
};
    
    const openEtherscanLink = () => {
        const etherscanURL = `https://etherscan.io/tx/${txn_hash}`;
        window.open(etherscanURL, "_blank");
    };

    useEffect(() => {
        if (senders && receivers) {
            const newData: (number | string)[][] = [["From", "To", "Amount"]];

            senders.forEach(sender => {
                newData.push([sender.sender_key, "", sender.amount]);
            });

            receivers.forEach(receiver => {
                newData.push(["", receiver.receiver_key, receiver.amount]);
            });

            setData(newData);
        }
    }, [senders, receivers]);

    return (
        <div className="dark:bg-gray-900 bg-sky-100 text-blue-950 dark:text-white p-4 lg:p-8 rounded-lg">
            {/* <div className="bg-white dark:bg-black rounded-lg text-center">
                <h1 className="text-xl font-bold mb-6 p-2">Transaction Hash: {txn_hash}</h1>
            </div> */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                <div className="flex flex-col">
                    <p className="text-sm text-sky-800 dark:text-gray-500 mb-2">Transaction Hash</p>
                    <div className="flex items-center gap-2">
                        <input className="text-base font-semibold w-full rounded pl-1" readOnly disabled value={txn_hash} />
                        <button onClick={() => navigator.clipboard.writeText(txn_hash)}>
                            <MdContentCopy />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col">
                    <p className="text-sm text-sky-800 dark:text-gray-500 mb-2">Status</p>
                    <input className="text-base font-semibold w-full rounded pl-1" readOnly disabled value={status} />
                </div>
                <div className="flex flex-col">
                    <p className="text-sm text-sky-800 dark:text-gray-500 mb-2">Amount</p>
                    <input className="text-base font-semibold w-full rounded pl-1" readOnly disabled value={amount} />
                </div>
                <div className="flex flex-col">
                    <p className="text-sm text-sky-800 dark:text-gray-500 mb-2">Type</p>
                    <input className="text-base font-semibold w-full rounded pl-1" readOnly disabled value={txnTypes[type]} />
                </div>
                <div className="flex flex-col">
                    <p className="text-sm text-sky-800 dark:text-gray-500 mb-2">Nonce</p>
                    <input className="text-base font-semibold w-full rounded pl-1" readOnly disabled value={nonce} />
                </div>
                <div className="flex flex-col">
                    <p className="text-sm text-sky-800 dark:text-gray-500 mb-2">Fee</p>
                    <input className="text-base font-semibold w-full rounded pl-1" readOnly disabled value={fee} />
                </div>
            </div>

            <div className="my-8">
                <h2 className="text-2xl font-semibold mb-4">Senders & Receivers</h2>
                <div className="flex justify-center dark:block hidden">
                    <div style={{ overflowX: 'auto' }}>
                        <Chart
                            chartType="Sankey"
                            width="500px"
                            height="300px"
                            data={data}
                            options={optionsDarkTheme}
                        />
                    </div>
                </div>
                <div className="flex justify-center dark:hidden">
                    <div style={{ overflowX: 'auto' }}>
                        <Chart
                            chartType="Sankey"
                            width="500px"
                            height="300px"
                            data={data}
                            options={optionsLightTheme}
                        />
                    </div>
                </div>
            </div>
            <div className="flex justify-center">
                    <button onClick={openEtherscanLink} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded focus:outline-none">
                        View More
                    </button>
                </div>
        </div>
    );
};

export default TxnView;
