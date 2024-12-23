import React, { useState } from 'react';
import { SecretNetworkClient } from "secretjs";

const QueryValue = () => {
    const [key, setKey] = useState('');
    const [viewingKey, setViewingKey] = useState('');
    const [queryResult, setQueryResult] = useState(null);

    const handleQuery = async (e) => {
        e.preventDefault();

        try {
            const secretjs = new SecretNetworkClient({
                url: "https://lcd.testnet.secretsaturn.net",
                chainId: "pulsar-3",
            });

            const query_tx = await secretjs.query.compute.queryContract({
                contract_address: process.env.REACT_APP_SECRET_ADDRESS,
                code_hash: process.env.REACT_APP_CODE_HASH,
                query: {
                    retrieve_value: {
                        key: key,
                        viewing_key: viewingKey
                    }
                },
            });

            setQueryResult(query_tx);
            console.log(query_tx);
        } catch (error) {
            console.error("Query failed", error);
            setQueryResult("Query failed, please try again.");
        }
    };

    return (
        <div className="flex flex-col full-height justify-start items-center lg:px-8 text-brand-orange">
            <div className="mt-4">
                <form onSubmit={handleQuery} className="space-y-4" style={{ width: '460px' }}>
                    <div className="border-4 border-brand-orange rounded-lg p-4">
                        <div>
                            <label className="block text-sm font-medium leading-6 w-full">
                                Key
                            </label>
                            <input
                                type="text"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="Enter key"
                                required
                                className="mt-2 block w-full pl-2 text-brand-blue rounded-md border border-brand-orange bg-brand-tan py-1.5 shadow-sm focus:ring-2 focus:ring-brand-blue sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium leading-6 w-full">
                                Viewing Key
                            </label>
                            <input
                                type="text"
                                value={viewingKey}
                                onChange={(e) => setViewingKey(e.target.value)}
                                placeholder="Enter viewing key"
                                required
                                className="mt-2 block w-full pl-2 text-brand-blue rounded-md border border-brand-orange bg-brand-tan py-1.5 shadow-sm focus:ring-2 focus:ring-brand-blue sm:text-sm"
                            />
                        </div>
                        <div className="flex justify-center mt-4">
                            <button
                                type="submit"
                                className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white  hover:bg-brand-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Query Value
                            </button>
                        </div>
                        {queryResult && (
                            <div className="mt-4 p-4 border border-gray-300 rounded-md">
                                <p><strong>Query Result:</strong></p>
                                <pre>{JSON.stringify(queryResult, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QueryValue;
