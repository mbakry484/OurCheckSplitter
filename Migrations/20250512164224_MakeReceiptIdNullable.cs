using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OurCheckSplitter.Api.Migrations
{
    /// <inheritdoc />
    public partial class MakeReceiptIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Friends_Receipts_ReceiptId",
                table: "Friends");

            migrationBuilder.AlterColumn<int>(
                name: "ReceiptId",
                table: "Friends",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AddForeignKey(
                name: "FK_Friends_Receipts_ReceiptId",
                table: "Friends",
                column: "ReceiptId",
                principalTable: "Receipts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Friends_Receipts_ReceiptId",
                table: "Friends");

            migrationBuilder.AlterColumn<int>(
                name: "ReceiptId",
                table: "Friends",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Friends_Receipts_ReceiptId",
                table: "Friends",
                column: "ReceiptId",
                principalTable: "Receipts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
