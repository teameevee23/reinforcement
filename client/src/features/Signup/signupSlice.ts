import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { SignupState, RaceSignup } from './types';

/**
 * {
    "lunch": {
        "slot1": [
            "angry_banana",
            "invincible_katya",
            "mushroom_mushroom"
        ],
        "slot3": [
            "monkey",
            "invincible_katya"
        ]
    },
    "dinner": {
        "slot3": [
            "angry_banana",
            "invincible_katya",
            "mushroom_mushroom"
        ]
    },
    "evening": {
        "slot2": [
            "mushroom_mushroom",
            "angry_banana",
            "very_angry_banana"
        ],
        "slot4": [
            "very_angry_banana",
            "invincible_katya",
            "monkey"
        ]
    }
}
 */

const initialState: SignupState = {
    time: {},
    loading: false,
    error: null,
};

export const fetchSignups = createAsyncThunk(
    'kart/schedule',
    async ( _ , { rejectWithValue }) => {
        try {
            const response = await fetch('/kart/schedule');
            if (!response.ok) throw new Error('Network response was not ok');
            const data: RaceSignup = await response.json();
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const signupForRace = createAsyncThunk(
    'kart/addparticipant',
    async ({ timeId, raceSlot, username }: { timeId: string, raceSlot: string, username: string }, { rejectWithValue }) => {
        try {
            const body = { timeId, raceSlot, username };
            const response = await fetch('/kart/addparticipant', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const data: RaceSignup = await response.json();
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const signupSlice = createSlice({
    name: 'signup',
    initialState,
    reducers: {
        // blank for now
    }, extraReducers: (builder) => {
        builder
            .addCase(fetchSignups.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSignups.fulfilled, (state, action) => {
                state.loading = false;
                const payload = action.payload as RaceSignup;
                Object.entries(payload).forEach(([timeId, slots]) => {
                    const timeKey = timeId as string;
                    // Make sure we initialize the time in state if it doesn't exist
                    if (!state.time[timeKey]) {
                        state.time[timeKey] = {};
                    }
                    // Now we can push races into the corresponding slot
                    // We use concat to avoid mutating the state directly
                    Object.entries(slots).forEach(([slotId, racerIds], index) => {
                        state.time[timeKey][slotId] = racerIds;
                    })
                });
            })            
            .addCase(fetchSignups.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(signupForRace.fulfilled, (state, action) => {
                const { timeId, raceSlot, username } = action.meta.arg;
                if(!state.time[timeId]) {
                    state.time[timeId] = {};
                }
                if(!state.time[timeId][raceSlot]) {
                    state.time[timeId][raceSlot] = [];
                }
                state.time[timeId][raceSlot].push(username);
            })
    }
})

export const {} = signupSlice.actions;

export const selectSignups = (state: RootState) => state.signups;

export default signupSlice.reducer;