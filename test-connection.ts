import { initializeDatabase, getSupabaseClient } from './src/config/database';
import { Tables } from './src/types/database';

async function testSupabaseConnection() {
    console.log('Testing Supabase connection...');
    
    try {
        // Initialize the database connection
        await initializeDatabase();
        
        // Get the Supabase client
        const supabase = getSupabaseClient();
        
        // Test basic connectivity by trying to query the users table
        console.log('Testing users table access...');
        const { data: users, error: usersError } = await supabase
            .from(Tables.USERS)
            .select('count')
            .limit(1);
            
        if (usersError && usersError.code !== 'PGRST116') {
            console.error('Users table error:', usersError);
        } else {
            console.log('✅ Users table accessible');
        }
        
        // Test chat_messages table access
        console.log('Testing chat_messages table access...');
        const { data: messages, error: messagesError } = await supabase
            .from(Tables.CHAT_MESSAGES)
            .select('count')
            .limit(1);
            
        if (messagesError && messagesError.code !== 'PGRST116') {
            console.error('Chat messages table error:', messagesError);
        } else {
            console.log('✅ Chat messages table accessible');
        }
        
        console.log('🎉 Supabase connection test completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Update your .env file with your actual Supabase credentials');
        console.log('2. Create the necessary tables in your Supabase database');
        console.log('3. Update your service files to use Supabase instead of TypeORM');
        
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        console.log('\nTroubleshooting:');
        console.log('1. Make sure your .env file has the correct SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
        console.log('2. Verify your Supabase project is active and accessible');
        console.log('3. Check that your API keys have the necessary permissions');
    }
}

// Run the test
testSupabaseConnection();
