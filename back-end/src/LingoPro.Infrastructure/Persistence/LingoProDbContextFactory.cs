using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace LingoPro.Infrastructure.Persistence;

/// <summary>
/// Design-time factory for <see cref="LingoProDbContext"/> enabling EF Core CLI migration commands directly against the Infrastructure layer.
/// </summary>
public sealed class LingoProDbContextFactory : IDesignTimeDbContextFactory<LingoProDbContext>
{
    public LingoProDbContext CreateDbContext(string[] args)
    {
        var basePath = Directory.GetCurrentDirectory();
        var webApiPath = Path.GetFullPath(Path.Combine(basePath, "..", "LingoPro.WebApi"));

        var configurationBuilder = new ConfigurationBuilder()
            .SetBasePath(Directory.Exists(webApiPath) ? webApiPath : basePath)
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
            .AddJsonFile("appsettings.Development.json", optional: true, reloadOnChange: false)
            .AddEnvironmentVariables();

        var configuration = configurationBuilder.Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? configuration.GetConnectionString("SupabasePostgres")
            ?? "Host=aws-0-ap-southeast-2.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres;Password=your-password;SSL Mode=Require;Trust Server Certificate=true";

        var optionsBuilder = new DbContextOptionsBuilder<LingoProDbContext>();
        optionsBuilder
            .UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.MigrationsAssembly(typeof(LingoProDbContext).Assembly.FullName);
                npgsqlOptions.MigrationsHistoryTable("__EFMigrationsHistory", "public");
                npgsqlOptions.CommandTimeout(30);
            })
            .UseSnakeCaseNamingConvention();

        return new LingoProDbContext(optionsBuilder.Options);
    }
}
