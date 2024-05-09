import React, { useEffect, useState } from "react";
import Service from "../services/Service";
import Transaction from "./Transaction";
import BlockCarousel from "./BlockCarousel";
import Card from "./Card";
import TransactionPool from "./TransactionPool";
import { toast } from "react-toastify";

interface StreamProps {
    setTransactionData: (txnData: any) => void;
    setBlockData: (blockData: any) => void;
    setLoading: (loading: boolean) => void;
    txnTypes: string[];
}

const Stream: React.FC<StreamProps> = ({setTransactionData, setBlockData, setLoading, txnTypes}) => {
    const [transaction, setTransaction] = useState<any[]>([]);
    const [block, setBlock] = useState<any[]>([]);
    const [isInitialBlocksSet, setIsInitialBlocksSet] = useState<boolean>(false);
    const [transactionPool, setTransactionPool] = useState<any[]>([]);
    const [initialTime, setInitialTime] = useState(new Date());
    const [count, setCount] = useState(0);
    
    const updateCount = (newCount: number) => {
        setCount(count + newCount);
    }
    
    const addTransactionToPool = (txn: any) => {
        setTransactionPool(prevTransactionPool => [...prevTransactionPool, txn]);
    };
    
    const addBlock = (newBlocks: any) => {
        setBlock(prevBlock => [...prevBlock, ...newBlocks]);
    };
    
    const removeBlock = () => {
         setBlock(prevBlock => prevBlock.slice(1)); // Removes the first block
    }
    
    useEffect(() => {
        const fetchInitialBlocks = async () => {
            try {
                const response = await Service.getInitialBlocks();
                addBlock(response.data.blocks);
            } catch (error) {
                toast.error("An error occurred!", { theme: "dark" });
            }
        }
        
        if (!isInitialBlocksSet) {
            fetchInitialBlocks();
            setIsInitialBlocksSet(true);
        }
    }, []);
    
    useEffect(() => {
        const fetchStreamData = async () => {
            try {
                const current_time = new Date();
                const start_time = initialTime.toISOString().replace("T", " ").replace("Z", "");
                const end_time = current_time.toISOString().replace("T", " ").replace("Z", "");
                setInitialTime(current_time);
                const response = await Service.getStreamData(start_time, end_time);
                setTransaction(response.data.transactions);
                // updateCount(streamData.transactions.length);
                const blocks = response.data.blocks;
                addBlock(blocks);
                const txnsToRemove = new Set();
                for (let i = 0; i < blocks.length; i++) {
                    if (Array.isArray(blocks[i].txn_hashes) && blocks[i].txn_hashes.length > 0) {
                        blocks[i].txn_hashes.forEach((txn_hash: string) => txnsToRemove.add(txn_hash))
                    }
                }
                setTransactionPool(prevTransactionPool => prevTransactionPool.filter(txn => !txnsToRemove.has(txn.txn_hash)));

            } catch (error) {
                toast.error("An error occurred!", { theme: "dark" });
            }
        };
        
        const intervalId = setInterval(fetchStreamData, 1000);
        return () => {
            clearInterval(intervalId);
        };
    }, [initialTime]);
    
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Transaction transaction={transaction} addTransactionToPool={addTransactionToPool} txnTypes={txnTypes} />
            <TransactionPool poolTransaction={transactionPool} setTransactionData={setTransactionData} count={count} setLoading={setLoading} txnTypes={txnTypes}/>
            
            {/* Flexbox container to center the BlockCarousel */}
            <div className="flex items-center justify-center mt-8">
                <BlockCarousel>
                    {block.map((b, index) => (
                        <Card
                            key={index}
                            title={b.block_hash}
                            content={b}
                            setBlockData={setBlockData}
                            setLoading={setLoading}
                        />
                    ))}
                </BlockCarousel>
            </div>
        </div>
    );
};

export default Stream;