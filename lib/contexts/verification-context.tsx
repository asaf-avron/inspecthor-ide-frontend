"use client";

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { apiClient } from '../api-client';
import type {
    VerifyResponse,
    ProofObligation,
} from '../types';

// === Verification State Types ===
export interface VerificationState {
    isVerifying: boolean;
    verificationResults: VerifyResponse | null;
    proofObligations: ProofObligation[];
}

// === Action Types ===
type VerificationAction =
    | { type: 'SET_VERIFYING'; payload: boolean }
    | { type: 'SET_VERIFICATION_RESULTS'; payload: VerifyResponse }
    | { type: 'SET_PROOF_OBLIGATIONS'; payload: ProofObligation[] };

// === Initial State ===
const initialState: VerificationState = {
    isVerifying: false,
    verificationResults: null,
    proofObligations: [],
};

// === Helper Functions ===
function convertToProofObligations(response: VerifyResponse): ProofObligation[] {
    const obligations: ProofObligation[] = [];
    
    for (const result of response.results) {
        obligations.push({
            id: `${result.type}-${result.name}`,
            name: result.name,
            location: result.location.file || 'unknown',
            status: result.status === 'verified' ? 'verified' : 
                   result.status === 'failed' ? 'failed' : 
                   result.status === 'timeout' ? 'warning' : 'pending',
            time: `${response.verification_time_ms}ms`,
            details: result.message,
        });
        
        // Add nested proof obligations
        for (const po of result.proof_obligations) {
            obligations.push({
                id: po.id,
                name: po.description,
                location: `${result.name}`,
                status: po.status === 'proven' ? 'verified' : 'failed',
                details: po.counterexample,
            });
        }
    }
    
    return obligations;
}

// === Reducer ===
function verificationReducer(state: VerificationState, action: VerificationAction): VerificationState {
    switch (action.type) {
        case 'SET_VERIFYING':
            return { ...state, isVerifying: action.payload };
        case 'SET_VERIFICATION_RESULTS':
            return {
                ...state,
                verificationResults: action.payload,
                proofObligations: convertToProofObligations(action.payload),
            };
        case 'SET_PROOF_OBLIGATIONS':
            return { ...state, proofObligations: action.payload };
        default:
            return state;
    }
}

// === Context Type ===
interface VerificationContextType {
    state: VerificationState;
    runVerification: (dafnyCode: string) => Promise<void>;
}

// === Context ===
const VerificationContext = createContext<VerificationContextType | null>(null);

// === Provider ===
export function VerificationProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(verificationReducer, initialState);

    const runVerification = useCallback(async (dafnyCode: string) => {
        dispatch({ type: 'SET_VERIFYING', payload: true });
        
        try {
            const response = await apiClient.verifyDafny({
                dafny_code: dafnyCode,
                timeout_seconds: 30,
                solver: 'z3',
            });
            
            dispatch({ type: 'SET_VERIFICATION_RESULTS', payload: response });
        } catch (error) {
            // On error, still set verifying to false
            dispatch({ type: 'SET_VERIFYING', payload: false });
            throw error;
        } finally {
            dispatch({ type: 'SET_VERIFYING', payload: false });
        }
    }, []);

    const contextValue: VerificationContextType = {
        state,
        runVerification,
    };

    return (
        <VerificationContext.Provider value={contextValue}>
            {children}
        </VerificationContext.Provider>
    );
}

// === Hook ===
export function useVerificationContext(): VerificationContextType {
    const context = useContext(VerificationContext);
    if (!context) {
        throw new Error('useVerificationContext must be used within a VerificationProvider');
    }
    return context;
}
