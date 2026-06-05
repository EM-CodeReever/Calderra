<script lang="ts">
  import type { LayoutData } from '../$types';
    let { data }: { data: LayoutData } = $props();
</script>

<div class="container mx-auto max-w-4xl p-6">
    <div class="card bg-base-100 shadow-xl">
        <div class="card-body">

            <!-- Header -->
            <div class="flex flex-col md:flex-row items-center gap-6 mb-8">
                <div class="avatar">
                    <div class="w-24">
                        <img
                            class="mask mask-squircle"
                            src="https://img.daisyui.com/images/stock/photo-1567653418876-5bb0e566e1c2.webp" 
                            alt="User Avatar"
                            />
                    </div>
                </div>

                <div class="text-center md:text-left">
                    <h1 class="text-3xl font-bold">Account Settings</h1>
                    <p class="text-base-content/70">
                        Manage your profile information
                    </p>
                </div>
            </div>

            <!-- Account Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold">Account Username</span>
                    </label>
                    <input
                        type="text"
                        value={data.userProfile?.username}
                        class="input input-bordered"
                        readonly
                    />
                </div>

                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold">Email Address</span>
                    </label>
                    <input
                        type="email"
                        value={data.userProfile?.auth_email}
                        class="input input-bordered"
                        readonly
                    />
                </div>

                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold">First Name</span>
                    </label>
                    <input
                        type="text"
                        value={data.userProfile?.first_name}
                        class="input input-bordered"
                        readonly
                    />
                </div>

                <div class="form-control">
                    <label class="label">
                        <span class="label-text font-semibold">Last Name</span>
                    </label>
                    <input
                        type="text"
                        value={data.userProfile?.last_name}
                        class="input input-bordered"
                        readonly
                    />
                </div>

            </div>

            <!-- Additional Info -->
            <div class="divider"></div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div class="stats shadow">
                    <div class="stat">
                        <div class="stat-title">Member Since</div>
                        <div class="stat-value text-lg">{data.userProfile?.created_at?.toDateString()}</div>
                    </div>
                </div>

                <div class="stats shadow">
                    <div class="stat">
                        <div class="stat-title">UserID</div>
                        <div class="stat-value text-lg">CLDR-{data.userProfile?.id}</div>
                    </div>
                </div>

            </div>

            <!-- Actions -->
            <div class="card-actions justify-end mt-8">
                <button class="btn btn-primary">
                    Edit Profile
                </button>

                <button class="btn btn-outline">
                    Change Password
                </button>
            </div>

        </div>
    </div>
</div>
