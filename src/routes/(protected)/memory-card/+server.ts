import { prisma } from '$lib';
import { getMemoryCardLeaderboard } from '$lib/memoryCardLeaderboard';
import { error, json } from '@sveltejs/kit';


type MC_Response = {
    player: number,
    time: string,
    score: string,
    mps: string,
    moves: number,
    matches: number,
    duration_seconds: number,
    emoji_set: string,
}

export const POST = async ({request,cookies}) => {
    try{
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        if(token === cookies.get("sessionToken")){
            console.log("Authorized request received with valid token.");
            let mc_response = await request.json() as MC_Response;

            await prisma.lB_MemoryCards.create({
                data:{
                    player_id: mc_response.player,
                    mps: parseFloat(mc_response.mps),
                    score: parseFloat(mc_response.score),
                    time: mc_response.time,
                    moves: mc_response.moves,
                    matches: mc_response.matches,
                    duration_seconds: mc_response.duration_seconds,
                    emoji_set: mc_response.emoji_set,
                }
            })

            const leaderboard = await getMemoryCardLeaderboard();
            const playerBestRank = leaderboard.findIndex((entry) => entry.player_id === BigInt(mc_response.player));
            const isHighScore = playerBestRank !== -1 && playerBestRank < 10;

            return json({success: true, isHighScore});
        }else{
            return new Response('Unauthorized', { status: 401 });
        }
    }catch(e){
        console.log(e);
        throw error(500,"An error has occured!")
    }
};
