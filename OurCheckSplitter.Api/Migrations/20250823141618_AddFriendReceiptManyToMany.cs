using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OurCheckSplitter.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFriendReceiptManyToMany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Friends_Receipts_ReceiptId",
                table: "Friends");

            migrationBuilder.DropIndex(
                name: "IX_Friends_ReceiptId",
                table: "Friends");

            migrationBuilder.DropColumn(
                name: "ReceiptId",
                table: "Friends");

            migrationBuilder.CreateTable(
                name: "FriendReceipts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FriendId = table.Column<int>(type: "INTEGER", nullable: false),
                    ReceiptId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FriendReceipts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FriendReceipts_Friends_FriendId",
                        column: x => x.FriendId,
                        principalTable: "Friends",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FriendReceipts_Receipts_ReceiptId",
                        column: x => x.ReceiptId,
                        principalTable: "Receipts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FriendReceipts_FriendId_ReceiptId",
                table: "FriendReceipts",
                columns: new[] { "FriendId", "ReceiptId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FriendReceipts_ReceiptId",
                table: "FriendReceipts",
                column: "ReceiptId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FriendReceipts");

            migrationBuilder.AddColumn<int>(
                name: "ReceiptId",
                table: "Friends",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Friends_ReceiptId",
                table: "Friends",
                column: "ReceiptId");

            migrationBuilder.AddForeignKey(
                name: "FK_Friends_Receipts_ReceiptId",
                table: "Friends",
                column: "ReceiptId",
                principalTable: "Receipts",
                principalColumn: "Id");
        }
    }
}
