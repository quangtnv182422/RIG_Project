using Manage_Receive_Issues_Goods.Models;
using Manage_Receive_Issues_Goods.Repositories.Implementations;
using Manage_Receive_Issues_Goods.Repository;
using Manage_Receive_Issues_Goods.Repository.Implementations;
using Manage_Receive_Issues_Goods.Service;
using Manage_Receive_Issues_Goods.Service.Implementations;
using Manage_Receive_Issues_Goods.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<RigContext>(options =>
{
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
});

// Register repositories
builder.Services.AddScoped<IScheduleRITDRepository, ScheduleRITDRepository>();
builder.Services.AddScoped<ISchedulereceivedTLIPRepository, SchedulereceivedTLIPRepository>();

// Register services
builder.Services.AddScoped<IScheduleRITDService, ScheduleRITDService>();
builder.Services.AddScoped<ISchedulereceivedTLIPService, SchedulereceivedTLIPService>();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
