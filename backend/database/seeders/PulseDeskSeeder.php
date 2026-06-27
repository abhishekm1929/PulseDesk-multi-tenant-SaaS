<?php
namespace Database\Seeders;

use App\Models\Organization;
use App\Models\SlaPolicy;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PulseDeskSeeder extends Seeder {
    public function run(): void {

        // ── Org A ──────────────────────────────────────────
        $orgA = Organization::create([
            'name' => 'Acme Corp',
            'slug' => 'acme-corp',
            'plan' => 'pro',
        ]);

        $adminA = User::create([
            'name'            => 'Alice Admin',
            'email'           => 'admin@acme.com',
            'password'        => Hash::make('password'),
            'organization_id' => $orgA->id,
            'role'            => 'admin',
        ]);
        $agent1 = User::create([
            'name'            => 'Bob Agent',
            'email'           => 'agent1@acme.com',
            'password'        => Hash::make('password'),
            'organization_id' => $orgA->id,
            'role'            => 'agent',
        ]);
        $agent2 = User::create([
            'name'            => 'Carol Agent',
            'email'           => 'agent2@acme.com',
            'password'        => Hash::make('password'),
            'organization_id' => $orgA->id,
            'role'            => 'agent',
        ]);
        $customer1 = User::create([
            'name'            => 'Dave Customer',
            'email'           => 'customer1@acme.com',
            'password'        => Hash::make('password'),
            'organization_id' => $orgA->id,
            'role'            => 'customer',
        ]);
        $customer2 = User::create([
            'name'            => 'Eve Customer',
            'email'           => 'customer2@acme.com',
            'password'        => Hash::make('password'),
            'organization_id' => $orgA->id,
            'role'            => 'customer',
        ]);

        // SLA policies for Org A
        foreach ([
            ['priority'=>'low',    'response_time'=>480, 'resolution_time'=>2880],
            ['priority'=>'medium', 'response_time'=>240, 'resolution_time'=>1440],
            ['priority'=>'high',   'response_time'=>60,  'resolution_time'=>480],
            ['priority'=>'urgent', 'response_time'=>15,  'resolution_time'=>120],
        ] as $sla) {
            SlaPolicy::create([...$sla, 'organization_id' => $orgA->id]);
        }

        // 12 tickets for Org A
        $ticketsA = [
            ['subject'=>'Cannot login to dashboard',       'priority'=>'urgent','status'=>'open'],
            ['subject'=>'Payment gateway error on checkout','priority'=>'high',  'status'=>'open'],
            ['subject'=>'Export to CSV not working',       'priority'=>'medium','status'=>'pending'],
            ['subject'=>'Wrong invoice amount',            'priority'=>'high',  'status'=>'open'],
            ['subject'=>'Feature request: dark mode',      'priority'=>'low',   'status'=>'open'],
            ['subject'=>'API rate limit too low',          'priority'=>'medium','status'=>'resolved'],
            ['subject'=>'2FA not sending SMS',             'priority'=>'urgent','status'=>'open'],
            ['subject'=>'Dashboard slow to load',          'priority'=>'medium','status'=>'pending'],
            ['subject'=>'Bulk delete not working',         'priority'=>'low',   'status'=>'closed'],
            ['subject'=>'Email notifications delayed',     'priority'=>'medium','status'=>'open'],
            ['subject'=>'Mobile app crashes on startup',   'priority'=>'high',  'status'=>'open'],
            ['subject'=>'Wrong timezone in reports',       'priority'=>'low',   'status'=>'resolved'],
        ];

        foreach ($ticketsA as $i => $t) {
            Ticket::create([
                'organization_id' => $orgA->id,
                'subject'         => $t['subject'],
                'description'     => "Detailed description for: {$t['subject']}. Customer reported this issue and needs urgent attention.",
                'status'          => $t['status'],
                'priority'        => $t['priority'],
                'requester_id'    => $i % 2 === 0 ? $customer1->id : $customer2->id,
                'assignee_id'     => $i % 3 === 0 ? $agent1->id : ($i % 3 === 1 ? $agent2->id : null),
                'tags'            => ['support', $t['priority']],
                'sla_breached'    => $t['priority'] === 'urgent' && $t['status'] === 'open',
            ]);
        }

        // ── Org B (multi-tenancy isolation proof) ──────────
        $orgB = Organization::create([
            'name' => 'Beta Industries',
            'slug' => 'beta-industries',
            'plan' => 'starter',
        ]);

        $adminB = User::create([
            'name'            => 'Frank Admin',
            'email'           => 'admin@beta.com',
            'password'        => Hash::make('password'),
            'organization_id' => $orgB->id,
            'role'            => 'admin',
        ]);

        foreach ([
            'Beta: Server down in production',
            'Beta: Billing discrepancy Q2',
            'Beta: New user onboarding broken',
        ] as $subject) {
            Ticket::create([
                'organization_id' => $orgB->id,
                'subject'         => $subject,
                'description'     => "Org B ticket: {$subject}",
                'status'          => 'open',
                'priority'        => 'high',
                'requester_id'    => $adminB->id,
                'assignee_id'     => null,
            ]);
        }

        $this->command->info('✅ PulseDesk seeded: 2 orgs, 5 users Org A, 12 tickets Org A, 3 tickets Org B');
    }
}
