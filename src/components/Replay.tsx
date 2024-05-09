import React, { useState } from 'react';
import Service from '../services/Service';
import Transaction from './Transaction';
import TransactionPool from './TransactionPool';
import BlockCarousel from './BlockCarousel';
import Card from './Card';
import BlockView from './BlockView';
import TxnView from './TxnView';
import { toast } from 'react-toastify';
import Modal from './Modal';
import { MdReplayCircleFilled } from 'react-icons/md';

interface ReplayProps {
    setLoading: (value: boolean) => void;
    txnTypes: string[];
    replayType: number
}

const Replay: React.FC<ReplayProps> = ({setLoading, txnTypes, replayType}) => {
    const [startTime, setStartTime] = useState('');
    const [replayedTransactions, setReplayedTransactions] = useState<any[]>([]);
    const [replayedBlocks, setReplayedBlocks] = useState<any[]>([]);
    const [replayTransactionPool, setReplayTransactionPool] = useState<any[]>([]);
    const [endTime, setEndTime] = useState('');
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [replayBlockData, setReplayBlockData] = useState<any | null>(null);
    const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
    const [replayTxnData, setReplayTxnData] = useState<any | null>(null);
    const [blockId, setBLockId] = useState('');
    
    const handleStartTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setStartTime(event.target.value);
    };
    
    const handleBlockIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setBLockId(event.target.value);
    };
    
    const addTransactionToReplayPool = (txn: any) => {
        setReplayTransactionPool(prevReplayTransactionPool => [...prevReplayTransactionPool, txn]);
    };
    
    const addBlocks = (newBlocks: any) => {
        setReplayedBlocks(prevBlocks => [...prevBlocks, ...newBlocks]);
    };
    
    const replayBlock = async () => {
        try {
            if (blockId === '') {
                toast.error("Block hash or Block number is required.", { theme: "dark" });
                return;
            }
            
            setReplayedTransactions([]); // Clear replayed transactions
            setReplayedBlocks([]); // Clear replayed blocks
            setReplayTransactionPool([]); // Clear replay transaction pool
            
            const insertTime = await fetchBlockData(blockId);
                        
            const endDateTime = new Date(new Date(insertTime).getTime() + 1 * 60000); // 5 minutes
            setEndTime(endDateTime.toISOString());

            let currentStartTime = new Date(insertTime);
            const id = setInterval(async () => {
                if (currentStartTime >= endDateTime) {
                    clearInterval(id);
                    setStartTime('');
                    setBLockId('');
                    return;
                }

                const endOfWindow = new Date(currentStartTime);
                endOfWindow.setSeconds(endOfWindow.getSeconds() + 5);
                await fetchStreamData(currentStartTime.toISOString().replace("T", " ").replace("Z", "").slice(0, -4), endOfWindow.toISOString().replace("T", " ").replace("Z", "").slice(0, -4));
                currentStartTime = endOfWindow;
            }, 1000);

            setIntervalId(id);
        } catch (error) {
            toast.error("An error occurred!", { theme: "dark" })
        }
    }

    const replayTransactions = async () => {
        try {
            if (startTime === '') {
                toast.error("Start time is required.", { theme: "dark" });
                return;
            }
            
            setReplayedTransactions([]); // Clear replayed transactions
            setReplayedBlocks([]); // Clear replayed blocks
            setReplayTransactionPool([]); // Clear replay transaction pool
                                    
            const endDateTime = new Date(new Date(startTime).getTime() + 1 * 60000); // 5 minutes
            setEndTime(endDateTime.toISOString());

            let currentStartTime = new Date(startTime);
            const id = setInterval(async () => {
                if (currentStartTime >= endDateTime) {
                    clearInterval(id);
                    setStartTime('');
                    return;
                }

                const endOfWindow = new Date(currentStartTime);
                endOfWindow.setSeconds(endOfWindow.getSeconds() + 5);
                await fetchStreamData(currentStartTime.toISOString().replace("T", " ").replace("Z", "").slice(0, -4), endOfWindow.toISOString().replace("T", " ").replace("Z", "").slice(0, -4));
                currentStartTime = endOfWindow;
            }, 1000);

            setIntervalId(id);
        } catch (error) {
            toast.error("An error occurred!", { theme: "dark" });
        }
    };

    const fetchStreamData = async (start_time: string, end_time: string) => {
        try {
            const response = await Service.getStreamData(start_time, end_time);
            setReplayedTransactions(response.data.transactions);
            const blocks = response.data.blocks;
            addBlocks(blocks);
            const txnsToRemove = new Set();
            for (let i = 0; i < blocks.length; i++) {
                if (Array.isArray(blocks[i].txn_hashes) && blocks[i].txn_hashes.length > 0) {
                    blocks[i].txn_hashes.forEach((txn_hash: string) => txnsToRemove.add(txn_hash))
                }
            }
            setReplayTransactionPool(prevReplayTransactionPool => prevReplayTransactionPool.filter(txn => !txnsToRemove.has(txn.txn_hash)));
        } catch (error) {
            toast.error("An error occurred!", { theme: "dark" });
        }
    };
    
    const fetchBlockData = async (block_id: string): Promise<string> => {
        try {
            const response = await Service.getBlockData(block_id);
            const insertTime = response.data.insert_time;
            setStartTime(insertTime);
            setReplayedBlocks([response.data]);         
            return insertTime;
        } catch (error) {
            toast.error("An error occurred!", { theme: "dark"});
            return "";
        }
    }
    
    const openReplayBlockModal = () => {
        setIsBlockModalOpen(true);
    };
    
    const closeReplayBlockModal = () => {
        setIsBlockModalOpen(false);
    };

    const handleSetBlockData = (blockData: any) => {
        setReplayBlockData(blockData);
        openReplayBlockModal();
    };
    
    const renderBlockContent = (blockData: any) => {
        return (
            <BlockView block={blockData} setBlockData={handleSetBlockData} closeBlockModal={closeReplayBlockModal} setLoading={setLoading} txnTypes={txnTypes}/>
        );
    }
    
    const openReplayTxnModal = () => {
        setIsTxnModalOpen(true);
    };
    
    const closeReplayTxnModal = () => {
        setIsTxnModalOpen(false);
    };

    const handleSetTxnData = (txnData: any) => {
        setReplayTxnData(txnData);
        openReplayTxnModal();
    };
    
    const renderTxnContent = (txnData: any) => {
        return (
            <TxnView txn={txnData} txnTypes={txnTypes}/>
        );
    }

    return (
        <div className="">
            {replayType == 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 dark:bg-gray-800 bg-sky-800 rounded-lg shadow-lg w-auto p-2">
                    <form onSubmit={(e) => e.preventDefault()} className="flex flex-row gap-2 items-center justify-center">
                        <label htmlFor="start-time" className="text-white text-xs lg:text-lg font-bold shrink-0">Start:</label>
                        <input
                        type="datetime-local"
                        id="start-time"
                        value={startTime}
                        onChange={handleStartTimeChange}
                        className="px-1 lg:px-2 py-1 text-xs lg:text-lg rounded-lg bg-sky-900 text-white focus:outline-none dark:bg-gray-900 dark:text-gray-300 w-full"
                        />
                        <button type="submit" onClick={replayTransactions} className="bg-blue-500 text-white p-1 rounded-lg hover:bg-blue-600 focus:outline-none text-sm lg:text-lg">
                            <MdReplayCircleFilled className="block lg:hidden" />
                            <span className='hidden lg:block'>Replay</span>
                        </button>
                    </form>
                </div>
            )}
            {replayType == 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 dark:bg-gray-800 bg-sky-800 rounded-lg shadow-lg w-auto p-2">
                    <form onSubmit={(e) => e.preventDefault()} className="flex flex-row gap-2 items-center justify-center">
                        <label htmlFor="block-id" className="text-white text-xs lg:text-lg font-bold shrink-0">Block Id:</label>
                        <input
                        type="text"
                        id="block-id"
                        value={blockId}
                        onChange={handleBlockIdChange}
                        className="px-1 lg:px-2 py-1 text-xs lg:text-lg rounded-lg bg-sky-900 text-white focus:outline-none dark:bg-gray-900 dark:text-gray-300 w-full"
                        />
                        <button type="submit" onClick={replayBlock} className="bg-blue-500 text-white p-1 rounded-lg hover:bg-blue-600 focus:outline-none text-sm lg:text-lg">
                            <MdReplayCircleFilled className="block lg:hidden" />
                            <span className='hidden lg:block'>Replay</span>
                        </button>
                    </form>
                </div>
            )}            
            <Transaction transaction={replayedTransactions} addTransactionToPool={addTransactionToReplayPool} txnTypes={txnTypes} />
            <TransactionPool poolTransaction={replayTransactionPool} setTransactionData={handleSetTxnData} count={0} setLoading={setLoading} txnTypes={txnTypes}/>
            {replayedBlocks.length === 0 && (
                <div className='flex items-center justify-center mt-8'>
                    <BlockCarousel children={undefined} />
                </div>
            )}
            {replayedBlocks.length > 0 && (
                <div className='flex items-center justify-center mt-8'>
                    <BlockCarousel>
                        {replayedBlocks.map((b, index) => (
                            <Card
                                key={index}
                                title={b.block_hash}
                                content={b}
                                setBlockData={handleSetBlockData}
                                setLoading={setLoading}
                            />
                        ))}
                    </BlockCarousel>
                </div>
            )}
            <Modal
                isOpen={isTxnModalOpen}
                title="Transaction Details"
                body={replayTxnData ? renderTxnContent(replayTxnData) : <div>Loading...</div>}
                buttons={[]}
                onClose={closeReplayTxnModal}
            />
            <Modal
                isOpen={isBlockModalOpen}
                title="Block Details"
                body={replayBlockData ? renderBlockContent(replayBlockData) : <div>Loading...</div>}
                buttons={[]}
                onClose={closeReplayBlockModal}
            />
        </div>
    );
};

export default Replay;
