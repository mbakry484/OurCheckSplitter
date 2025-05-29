using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OurCheckSplitter.Api.Migrations
{
    /// <inheritdoc />
    public partial class Friendconfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Friends_Receipts_ReceiptId",
                table: "Friends");

            migrationBuilder.AddColumn<int>(
                name: "ReceiptId1",
                table: "Friends",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Friends_ReceiptId1",
                table: "Friends",
                column: "ReceiptId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Friends_Receipts_ReceiptId",
                table: "Friends",
                column: "ReceiptId",
                principalTable: "Receipts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Friends_Receipts_ReceiptId1",
                table: "Friends",
                column: "ReceiptId1",
                principalTable: "Receipts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Friends_Receipts_ReceiptId",
                table: "Friends");

            migrationBuilder.DropForeignKey(
                name: "FK_Friends_Receipts_ReceiptId1",
                table: "Friends");

            migrationBuilder.DropIndex(
                name: "IX_Friends_ReceiptId1",
                table: "Friends");

            migrationBuilder.DropColumn(
                name: "ReceiptId1",
                table: "Friends");

            migrationBuilder.AddForeignKey(
                name: "FK_Friends_Receipts_ReceiptId",
                table: "Friends",
                column: "ReceiptId",
                principalTable: "Receipts",
                principalColumn: "Id");
        }
    }
}
